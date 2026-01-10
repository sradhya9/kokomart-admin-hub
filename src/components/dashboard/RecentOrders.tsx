import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const orders = [
  {
    id: "ORD-001",
    customer: "Rahul Kumar",
    amount: 1250,
    status: "DELIVERED",
    time: "2 hours ago",
  },
  {
    id: "ORD-002",
    customer: "Priya Singh",
    amount: 890,
    status: "OUT_FOR_DELIVERY",
    time: "3 hours ago",
  },
  {
    id: "ORD-003",
    customer: "Amit Patel",
    amount: 1560,
    status: "PACKING",
    time: "4 hours ago",
  },
  {
    id: "ORD-004",
    customer: "Sneha Gupta",
    amount: 720,
    status: "CUTTING",
    time: "5 hours ago",
  },
  {
    id: "ORD-005",
    customer: "Vikram Sharma",
    amount: 2100,
    status: "RECEIVED",
    time: "6 hours ago",
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

export function RecentOrders() {
  return (
    <div className="chart-container animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
        <p className="text-sm text-muted-foreground">Latest 5 orders</p>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {order.customer.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium text-foreground">{order.customer}</p>
                <p className="text-sm text-muted-foreground">{order.id} • {order.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn("status-badge", statusStyles[order.status])}>
                {statusLabels[order.status]}
              </span>
              <p className="font-semibold text-foreground">₹{order.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
