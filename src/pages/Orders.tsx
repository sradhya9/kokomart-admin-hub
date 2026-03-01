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
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where, orderBy } from "firebase/firestore";

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
    const unsub = onSnapshot(query(collection(db, "orders"), orderBy("created_at", "desc")), (snapshot) => {
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
        <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 gap-0 rounded-2xl border-0 shadow-2xl overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="gradient-primary p-6 pr-12">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm flex-shrink-0">
                <Package className="h-4 w-4 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-white tracking-tight">
                Order Details
              </DialogTitle>
            </div>
            <div className="flex items-center gap-3 ml-11">
              <p className="text-sm font-semibold text-white/80 font-mono">
                #{selectedOrder?.display_id || selectedOrder?.id}
              </p>
              <span className={cn("status-badge text-xs font-semibold", statusStyles[selectedOrder?.status || ""])}>
                {statusLabels[selectedOrder?.status || ""]}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/60 ml-auto">
                <Clock className="h-3 w-3" />
                {selectedOrder?.createdAt}
              </span>
            </div>
          </div>

          {selectedOrder && (
            <div className="p-6 space-y-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ background: 'hsl(var(--background))' }}>
              {/* Cancelled banner */}
              {selectedOrder.status === "CANCELLED" && (
                <div className="rounded-xl border border-red-200 p-4" style={{ background: 'hsl(356 80% 97%)' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0" />
                    <strong className="text-sm font-semibold text-red-800">Order Cancelled</strong>
                  </div>
                  <p className="text-sm text-red-600 mt-1 ml-4">This order has been cancelled and will not be processed.</p>
                </div>
              )}

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border p-4 text-center" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Amount</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--primary))' }}>₹{selectedOrder.finalAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Items</p>
                  <p className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{selectedOrder.items.length}</p>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Payment</p>
                  <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>{selectedOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                  <User className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                  <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--foreground))' }}>Customer Information</h4>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ background: 'hsl(var(--card))' }}>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Name & Phone</p>
                    <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{selectedOrder.customer}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Delivery Address</p>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                      <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{selectedOrder.address || "No address provided"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Note */}
              {selectedOrder.note && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                    <FileText className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                    <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--foreground))' }}>Order Note</h4>
                  </div>
                  <div className="p-4" style={{ background: 'hsl(var(--card))' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{selectedOrder.note}</p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                  <Package className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                  <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--foreground))' }}>Order Items</h4>
                  <span className="ml-auto text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                    {selectedOrder.items.length} {selectedOrder.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div style={{ background: 'hsl(var(--card))' }}>
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex justify-between items-center px-4 py-3.5",
                        index !== selectedOrder.items.length - 1 && "border-b"
                      )}
                      style={{ borderColor: 'hsl(var(--border) / 0.6)' }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold"
                          style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Qty: {item.quantity}</span>
                            {item.cuttingType && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' }}>
                                ✂ {item.cuttingType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>₹{item.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                  <CreditCard className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                  <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--foreground))' }}>Price Breakdown</h4>
                </div>
                <div className="p-4 space-y-2.5" style={{ background: 'hsl(var(--card))' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Subtotal</span>
                    <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>₹{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'hsl(141 73% 35%)' }}>Discount Applied</span>
                      <span className="font-medium" style={{ color: 'hsl(141 73% 35%)' }}>−₹{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.walletUsed > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'hsl(var(--primary))' }}>Wallet Points Used</span>
                      <span className="font-medium" style={{ color: 'hsl(var(--primary))' }}>−₹{selectedOrder.walletUsed.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 mt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                    <span className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>Total Paid</span>
                    <span className="font-bold text-lg" style={{ color: 'hsl(var(--primary))' }}>₹{selectedOrder.finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ background: 'hsl(var(--muted) / 0.5)', borderColor: 'hsl(var(--border))' }}>
                  <Clock className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                  <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'hsl(var(--foreground))' }}>Order Progress</h4>
                </div>
                <div className="p-5" style={{ background: 'hsl(var(--card))' }}>
                  <div className="relative">
                    {/* Background line */}
                    <div className="absolute top-4 left-4 right-4 h-0.5" style={{ background: 'hsl(var(--border))' }} />
                    {/* Progress line */}
                    <div
                      className="absolute top-4 left-4 h-0.5 transition-all duration-700"
                      style={{
                        background: 'hsl(var(--primary))',
                        width: selectedOrder.status === "CANCELLED"
                          ? "0%"
                          : `${(statusFlow.indexOf(selectedOrder.status) / (statusFlow.length - 1)) * 100}%`
                      }}
                    />
                    <div className="relative flex items-start justify-between">
                      {statusFlow.map((status, index) => {
                        const currentIndex = statusFlow.indexOf(selectedOrder.status);
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex && selectedOrder.status !== "CANCELLED";
                        return (
                          <div key={status} className="flex flex-col items-center" style={{ width: `${100 / statusFlow.length}%` }}>
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 z-10",
                                isCompleted
                                  ? "text-white border-transparent"
                                  : isCurrent
                                    ? "text-white border-transparent"
                                    : "border-2"
                              )}
                              style={{
                                background: isCompleted
                                  ? 'hsl(var(--primary))'
                                  : isCurrent
                                    ? 'hsl(var(--primary))'
                                    : 'hsl(var(--card))',
                                borderColor: isCompleted || isCurrent
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--border))',
                                color: isCompleted || isCurrent ? 'white' : 'hsl(var(--muted-foreground))',
                                boxShadow: isCurrent ? '0 0 0 4px hsl(var(--primary) / 0.15)' : 'none'
                              }}
                            >
                              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                            </div>
                            <p
                              className="text-center mt-2 leading-tight font-medium"
                              style={{
                                fontSize: '10px',
                                color: isCompleted || isCurrent
                                  ? 'hsl(var(--primary))'
                                  : 'hsl(var(--muted-foreground))'
                              }}
                            >
                              {statusLabels[status]}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedOrder.status === "CANCELLED" && (
                    <p className="text-center text-xs font-semibold mt-4 py-2 rounded-lg" style={{ color: 'hsl(356 80% 47%)', background: 'hsl(356 80% 97%)' }}>
                      This order was cancelled and did not progress through the pipeline.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
