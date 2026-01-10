import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { WalletChart } from "@/components/dashboard/WalletChart";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const walletLogs = [
  {
    id: "1",
    user: "Rahul Kumar",
    action: "credit",
    points: 15,
    reason: "Order ORD-001 delivered (1.5kg)",
    admin: "Admin User",
    timestamp: "2024-01-10 11:30 AM",
  },
  {
    id: "2",
    user: "Priya Singh",
    action: "debit",
    points: 50,
    reason: "Redeemed on order ORD-002",
    admin: "System",
    timestamp: "2024-01-10 10:45 AM",
  },
  {
    id: "3",
    user: "Amit Patel",
    action: "credit",
    points: 25,
    reason: "Manual adjustment - Customer complaint resolution",
    admin: "Admin User",
    timestamp: "2024-01-10 09:15 AM",
  },
  {
    id: "4",
    user: "Vikram Sharma",
    action: "credit",
    points: 30,
    reason: "Order ORD-010 delivered (3kg)",
    admin: "System",
    timestamp: "2024-01-09 06:30 PM",
  },
  {
    id: "5",
    user: "Sneha Gupta",
    action: "debit",
    points: 20,
    reason: "Manual adjustment - Points expired",
    admin: "Admin User",
    timestamp: "2024-01-09 04:00 PM",
  },
];

export default function WalletPage() {
  return (
    <AdminLayout title="Wallet & Points" subtitle="Manage chicken points system">
      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Total Points Issued"
          value="12,450"
          change={{ value: 8.5, type: "increase" }}
          icon={TrendingUp}
          iconColor="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Points Redeemed"
          value="8,320"
          change={{ value: 12.3, type: "increase" }}
          icon={TrendingDown}
          iconColor="bg-success/10 text-success"
        />
        <MetricCard
          title="Pending Points"
          value="4,130"
          change={{ value: 2.1, type: "neutral" }}
          icon={Wallet}
          iconColor="bg-chart-3/10 text-chart-3"
        />
        <MetricCard
          title="Redemption Rate"
          value="66.8%"
          change={{ value: 4.2, type: "increase" }}
          icon={ArrowUpDown}
          iconColor="bg-chart-4/10 text-chart-4"
        />
      </div>

      {/* Wallet Rules */}
      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Wallet Rules</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-sm text-muted-foreground">Earning Rate</p>
            <p className="text-xl font-bold text-primary">1 KG = 1 Point</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-sm text-muted-foreground">Point Value</p>
            <p className="text-xl font-bold text-success">1 Point = ₹1</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-4">
            <p className="text-sm text-muted-foreground">Credit Timing</p>
            <p className="text-xl font-bold">After Delivery</p>
          </div>
        </div>
      </div>

      {/* Chart and Logs */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <WalletChart />
        
        {/* Recent Wallet Logs */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Wallet Activity</h3>
          <div className="space-y-4">
            {walletLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      log.action === "credit"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {log.action === "credit" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{log.user}</p>
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {log.admin} • {log.timestamp}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={log.action === "credit" ? "default" : "secondary"}
                  className={cn(
                    log.action === "credit"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {log.action === "credit" ? "+" : "-"}{log.points} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
