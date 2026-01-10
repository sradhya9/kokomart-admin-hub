import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { ProductSalesChart } from "@/components/dashboard/ProductSalesChart";
import { WalletChart } from "@/components/dashboard/WalletChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { ShoppingCart, IndianRupee, Clock, Users } from "lucide-react";

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Auto refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date());
  };

  return (
    <AdminLayout
      title="Dashboard"
      subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
      onRefresh={handleRefresh}
    >
      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Orders (Today)"
          value="156"
          change={{ value: 12.5, type: "increase" }}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Revenue (Today)"
          value="₹48,250"
          change={{ value: 8.2, type: "increase" }}
          icon={IndianRupee}
          iconColor="bg-success/10 text-success"
        />
        <MetricCard
          title="Pending Orders"
          value="23"
          change={{ value: 3.1, type: "decrease" }}
          icon={Clock}
          iconColor="bg-warning/10 text-warning"
        />
        <MetricCard
          title="Total Users"
          value="2,847"
          change={{ value: 5.4, type: "increase" }}
          icon={Users}
          iconColor="bg-chart-3/10 text-chart-3"
        />
      </div>

      {/* Charts Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SalesChart />
        <ProductSalesChart />
      </div>

      {/* Bottom Section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <WalletChart />
      </div>
    </AdminLayout>
  );
}
