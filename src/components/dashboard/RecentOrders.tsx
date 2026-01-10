import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";



const statusStyles: Record<string, string> = {
  RECEIVED: "status-received",
  CUTTING: "status-cutting",
  PACKING: "status-packing",
  OUT_FOR_DELIVERY: "status-out-for-delivery",
  DELIVERED: "status-delivered",
  pending: "status-received", // Map firebase status if needed
};

const statusLabels: Record<string, string> = {
  RECEIVED: "Received",
  CUTTING: "Cutting",
  PACKING: "Packing",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  pending: "Pending",
};

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: string;
  time: string;
}

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="chart-container animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
        <p className="text-sm text-muted-foreground">Latest orders</p>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                {order.customer.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-foreground">{order.customer}</p>
                <p className="text-sm text-muted-foreground">{order.id} • {order.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn("status-badge", statusStyles[order.status] || "status-received")}>
                {statusLabels[order.status] || order.status}
              </span>
              <p className="font-semibold text-foreground">₹{order.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No recent orders found</p>
        )}
      </div>
    </div>
  );
}
