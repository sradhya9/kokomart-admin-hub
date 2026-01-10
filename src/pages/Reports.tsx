import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { ProductSalesChart } from "@/components/dashboard/ProductSalesChart";
import { WalletChart } from "@/components/dashboard/WalletChart";
import { Download, Calendar, FileSpreadsheet } from "lucide-react";

const reportData = [
  { date: "2024-01-10", orders: 156, revenue: 48250, newUsers: 12 },
  { date: "2024-01-09", orders: 142, revenue: 44100, newUsers: 8 },
  { date: "2024-01-08", orders: 168, revenue: 52300, newUsers: 15 },
  { date: "2024-01-07", orders: 135, revenue: 41200, newUsers: 10 },
  { date: "2024-01-06", orders: 189, revenue: 58900, newUsers: 22 },
  { date: "2024-01-05", orders: 201, revenue: 62400, newUsers: 18 },
  { date: "2024-01-04", orders: 178, revenue: 55100, newUsers: 14 },
];

export default function Reports() {
  const [period, setPeriod] = useState("weekly");

  const handleExport = (format: string) => {
    // In a real app, this would trigger a download
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Sales and performance insights">
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">1,169</p>
          <p className="text-xs text-success mt-1">+12.5% vs last week</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">₹3,62,250</p>
          <p className="text-xs text-success mt-1">+8.2% vs last week</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
          <p className="text-2xl font-bold">₹310</p>
          <p className="text-xs text-muted-foreground mt-1">-2.1% vs last week</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">New Users</p>
          <p className="text-2xl font-bold">99</p>
          <p className="text-xs text-success mt-1">+18.4% vs last week</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart />
        <ProductSalesChart />
      </div>

      {/* Detailed Report Table */}
      <div className="mt-6 rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Daily Breakdown</h3>
          <p className="text-sm text-muted-foreground">Last 7 days performance</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Avg Order Value</th>
              <th>New Users</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row) => (
              <tr key={row.date} className="animate-fade-in">
                <td className="font-medium">{row.date}</td>
                <td>{row.orders}</td>
                <td className="font-semibold">₹{row.revenue.toLocaleString()}</td>
                <td>₹{Math.round(row.revenue / row.orders)}</td>
                <td>{row.newUsers}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50">
            <tr>
              <td className="font-semibold">Total</td>
              <td className="font-semibold">
                {reportData.reduce((acc, r) => acc + r.orders, 0)}
              </td>
              <td className="font-semibold">
                ₹{reportData.reduce((acc, r) => acc + r.revenue, 0).toLocaleString()}
              </td>
              <td className="font-semibold">
                ₹{Math.round(
                  reportData.reduce((acc, r) => acc + r.revenue, 0) /
                    reportData.reduce((acc, r) => acc + r.orders, 0)
                )}
              </td>
              <td className="font-semibold">
                {reportData.reduce((acc, r) => acc + r.newUsers, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Wallet Summary */}
      <div className="mt-6">
        <WalletChart />
      </div>
    </AdminLayout>
  );
}
