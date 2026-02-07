import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where } from "firebase/firestore";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  cuttingType?: string;
}

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  walletUsed: number;
  finalAmount: number;
  paymentMethod: string;
  status: string;
  address: string;
  createdAt: string;
}

const statusFlow = ["RECEIVED", "CUTTING", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED"];
// Additional statuses that are not part of normal flow but should be filterable/displayed
const extraStatuses = ["CANCELLED"];

// Initial orders removed, fetching from Firebase

const statusStyles: Record<string, string> = {
  RECEIVED: "status-received",
  CUTTING: "status-cutting",
  PACKING: "status-packing",
  OUT_FOR_DELIVERY: "status-out-for-delivery",
  DELIVERED: "status-delivered",
  CANCELLED: "status-cancelled",
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Received",
  CUTTING: "Cutting",
  PACKING: "Packing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // statuses available for filtering (include extras like CANCELLED)
  const statusesForFilter = ["all", ...statusFlow, ...extraStatuses];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const processOrders = async () => {
        const fetchedOrders = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // Fetch user data
          let customer = "Unknown";
          let phone = "";
          let address = "";

          if (data.user_id) {
            try {
              const userQuery = query(collection(db, "users"), where("id", "==", data.user_id));
              const userSnap = await getDocs(userQuery);
              if (!userSnap.empty) {
                const userData = userSnap.docs[0].data();
                customer = userData.name || "Unknown";
                phone = userData.phone || "";
                address = userData.address || "";
              }
            } catch (e) { console.error(e); }
          }

          // Map items
          const items = (data.items || []).map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            cuttingType: item.cuttingType
          }));

          const status = (data.status || "RECEIVED").toUpperCase();

          return {
            id: docSnap.id,
            customer,
            phone,
            items,
            subtotal: data.total_amount || 0,
            discount: data.discount || 0,
            walletUsed: data.wallet_used || 0,
            finalAmount: data.final_amount || 0,
            paymentMethod: "Online", // Defaulting as not present
            status,
            address,
            createdAt: new Date(data.created_at).toLocaleString()
          } as Order;
        }));

        // Sort by date desc (if not querying with orderBy)
        fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setOrders(fetchedOrders);
      };
      processOrders();
    });
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== "DELIVERED" && order.status !== "CANCELLED") {
      const currentIndex = statusFlow.indexOf(order.status);
      const nextStatus = statusFlow[currentIndex + 1];

      try {
        await updateDoc(doc(db, "orders", orderId), {
          status: nextStatus.toLowerCase() // Store lowercase in DB? Prompt had lowercase "pending".
        });
        // UI update will happen via snapshot
      } catch (e) {
        console.error("Error updating status:", e);
      }
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1) return null;
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  return (
    <AdminLayout title="Orders" subtitle="Manage order lifecycle">
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusesForFilter.filter(s => s !== 'all').map((status) => (
                <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="animate-fade-in">
                <td className="font-medium">{order.id}</td>
                <td>
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">{order.phone}</p>
                  </div>
                </td>
                <td className="font-semibold">₹{order.finalAmount.toLocaleString()}</td>
                <td>
                  <Badge variant="secondary">{order.paymentMethod}</Badge>
                </td>
                <td>
                  <span className={cn("status-badge", statusStyles[order.status])}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="text-sm text-muted-foreground">{order.createdAt}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id)}
                        className="text-xs"
                      >
                        <ChevronRight className="h-3 w-3 mr-1" />
                        {statusLabels[getNextStatus(order.status) || ""]}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Cancelled banner */}
              {selectedOrder.status === "CANCELLED" && (
                <div className="rounded-lg bg-destructive/10 text-destructive p-4">
                  <strong>Order Cancelled</strong>
                  <div className="text-sm text-muted-foreground">This order has been cancelled and will not be processed.</div>
                </div>
              )}
              {/* Customer Info */}
              <div className="rounded-lg bg-secondary/50 p-4">
                <h4 className="font-semibold mb-2">Customer Information</h4>
                <p>{selectedOrder.customer}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                <p className="text-sm text-muted-foreground mt-2">{selectedOrder.address}</p>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        {item.cuttingType && (
                          <p className="text-xs bg-blue-100 text-blue-800 w-fit px-2 py-1 rounded mt-1">
                            Cutting: {item.cuttingType}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">₹{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                {selectedOrder.walletUsed > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Wallet Points Used</span>
                    <span>-₹{selectedOrder.walletUsed}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{selectedOrder.finalAmount}</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h4 className="font-semibold mb-3">Status Timeline</h4>
                <div className="flex items-center gap-2">
                  {statusFlow.map((status, index) => {
                    const currentIndex = statusFlow.indexOf(selectedOrder.status);
                    const isCompleted = index <= currentIndex;
                    const isCurrent = status === selectedOrder.status;
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                            isCompleted
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        {index < statusFlow.length - 1 && (
                          <div
                            className={cn(
                              "h-1 w-8 rounded-full",
                              index < currentIndex ? "bg-success" : "bg-muted"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {statusFlow.map((status) => (
                    <span key={status} className="w-8 text-center">
                      {statusLabels[status].split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
