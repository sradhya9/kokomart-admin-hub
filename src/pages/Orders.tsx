import { useState } from "react";
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
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

const initialOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "Rahul Kumar",
    phone: "+91 98765 43210",
    items: [
      { name: "Whole Chicken", quantity: 2, price: 360 },
      { name: "Chicken Breast", quantity: 1, price: 320 },
    ],
    subtotal: 1040,
    discount: 104,
    walletUsed: 50,
    finalAmount: 886,
    paymentMethod: "UPI",
    status: "DELIVERED",
    address: "123 Main St, Bangalore - 560001",
    createdAt: "2024-01-10 08:30 AM",
  },
  {
    id: "ORD-002",
    customer: "Priya Singh",
    phone: "+91 87654 32109",
    items: [
      { name: "Chicken Wings", quantity: 2, price: 560 },
      { name: "Chicken Drumstick", quantity: 1, price: 220 },
    ],
    subtotal: 780,
    discount: 0,
    walletUsed: 0,
    finalAmount: 780,
    paymentMethod: "COD",
    status: "OUT_FOR_DELIVERY",
    address: "456 Park Ave, Bangalore - 560002",
    createdAt: "2024-01-10 09:15 AM",
  },
  {
    id: "ORD-003",
    customer: "Amit Patel",
    phone: "+91 76543 21098",
    items: [
      { name: "Country Chicken", quantity: 1, price: 450 },
    ],
    subtotal: 450,
    discount: 45,
    walletUsed: 25,
    finalAmount: 380,
    paymentMethod: "Card",
    status: "PACKING",
    address: "789 Lake View, Bangalore - 560003",
    createdAt: "2024-01-10 10:00 AM",
  },
  {
    id: "ORD-004",
    customer: "Sneha Gupta",
    phone: "+91 65432 10987",
    items: [
      { name: "Whole Chicken", quantity: 3, price: 540 },
    ],
    subtotal: 540,
    discount: 0,
    walletUsed: 0,
    finalAmount: 540,
    paymentMethod: "UPI",
    status: "CUTTING",
    address: "321 Hill Road, Bangalore - 560004",
    createdAt: "2024-01-10 10:30 AM",
  },
  {
    id: "ORD-005",
    customer: "Vikram Sharma",
    phone: "+91 54321 09876",
    items: [
      { name: "Chicken Breast", quantity: 2, price: 640 },
      { name: "Chicken Wings", quantity: 1, price: 280 },
    ],
    subtotal: 920,
    discount: 92,
    walletUsed: 30,
    finalAmount: 798,
    paymentMethod: "UPI",
    status: "RECEIVED",
    address: "654 Garden St, Bangalore - 560005",
    createdAt: "2024-01-10 11:00 AM",
  },
];

const statusStyles: Record<string, string> = {
  RECEIVED: "status-received",
  CUTTING: "status-cutting",
  PACKING: "status-packing",
  OUT_FOR_DELIVERY: "status-out-for-delivery",
  DELIVERED: "status-delivered",
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Received",
  CUTTING: "Cutting",
  PACKING: "Packing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (orderId: string) => {
    setOrders(orders.map((order) => {
      if (order.id === orderId && order.status !== "DELIVERED") {
        const currentIndex = statusFlow.indexOf(order.status);
        const nextStatus = statusFlow[currentIndex + 1];
        return { ...order, status: nextStatus };
      }
      return order;
    }));
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
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
              {statusFlow.map((status) => (
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
                    {order.status !== "DELIVERED" && (
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
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
