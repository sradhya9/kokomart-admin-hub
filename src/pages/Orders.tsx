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
import { Search, Eye, ChevronRight, Check, User, MapPin, FileText, Package, CreditCard, Clock } from "lucide-react";
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
  display_id?: string;
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
  note?: string;
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
            display_id: data.display_id || docSnap.id,
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
            createdAt: new Date(data.created_at).toLocaleString(),
            note: data.note || ""
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
      (order.display_id || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                <td className="font-medium">{order.display_id || order.id}</td>
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
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Order Details - {selectedOrder?.display_id || selectedOrder?.id}
            </DialogTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedOrder?.createdAt}
              </span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-medium", statusStyles[selectedOrder?.status || ""])}>
                {statusLabels[selectedOrder?.status || ""]}
              </span>
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Cancelled banner */}
              {selectedOrder.status === "CANCELLED" && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <strong className="text-sm font-semibold">Order Cancelled</strong>
                  </div>
                  <p className="text-sm text-red-700 mt-1">This order has been cancelled and will not be processed.</p>
                </div>
              )}

              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Total Amount</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">₹{selectedOrder.finalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Items</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-800">{selectedOrder.items.length}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">Payment</h4>
                  </div>
                  <p className="text-lg font-semibold text-purple-800">{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold">Customer Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{selectedOrder.customer}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedOrder.phone}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-600">{selectedOrder.address}</p>
                  </div>
                </div>
              </div>

              {/* Order Note */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold">Order Note</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedOrder.note || "No note provided"}</p>
              </div>

              {/* Items */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold">Order Items</h4>
                </div>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          {item.cuttingType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Cutting: {item.cuttingType}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">₹{item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold">Price Breakdown</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-₹{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.walletUsed > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Wallet Points Used</span>
                      <span className="font-medium">-₹{selectedOrder.walletUsed.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-green-600">₹{selectedOrder.finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-gray-600" />
                  <h4 className="text-lg font-semibold">Order Status Timeline</h4>
                </div>
                <div className="relative">
                  {/* Background connecting line */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200"></div>
                  
                  <div className="relative flex items-center justify-between px-5">
                    {statusFlow.map((status, index) => {
                      const currentIndex = statusFlow.indexOf(selectedOrder.status);
                      const isCompleted = index <= currentIndex;
                      const isCurrent = status === selectedOrder.status;
                      return (
                        <div key={status} className="flex flex-col items-center relative">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300 shadow-sm",
                              isCompleted
                                ? "bg-green-500 border-green-500 text-white"
                                : isCurrent
                                ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                                : "bg-white border-gray-300 text-gray-500"
                            )}
                          >
                            {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                          </div>
                          <p className={cn(
                            "text-xs text-center mt-3 font-medium max-w-20 leading-tight",
                            isCompleted 
                              ? "text-green-700" 
                              : isCurrent 
                              ? "text-blue-700" 
                              : "text-gray-500"
                          )}>
                            {statusLabels[status]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Active progress line */}
                  <div className="absolute top-5 left-5 h-0.5 bg-green-500 transition-all duration-500"
                       style={{
                         width: selectedOrder.status === "CANCELLED" 
                           ? "0%" 
                           : `${((statusFlow.indexOf(selectedOrder.status) + 1) / statusFlow.length) * 100}%`
                       }}>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
