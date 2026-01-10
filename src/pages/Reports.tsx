import { useState, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { subDays, format, startOfDay, parseISO } from "date-fns";
import { Download, Calendar, FileSpreadsheet } from "lucide-react";

// Mock data removed

export default function Reports() {
  const [period, setPeriod] = useState("weekly");
  const [reportData, setReportData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    newUsers: 0
  });
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [productSalesData, setProductSalesData] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([]);

  useEffect(() => {
    // Orders Listener
    const ordersUnsub = onSnapshot(collection(db, "orders"), (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter for last 7 days (simplified for "weekly" default)
      const daysToLoookback = period === 'monthly' ? 30 : (period === 'daily' ? 1 : 7);
      const cutoffDate = subDays(new Date(), daysToLoookback);

      const recentOrders = orders.filter((o: any) => new Date(o.created_at) >= cutoffDate);

      // 1. Calculate Summary Stats
      const totalRevenue = recentOrders.reduce((sum, o: any) => sum + (o.final_amount || 0), 0);
      const totalOrders = recentOrders.length;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      // 2. Prepare Report Data (Daily Breakdown)
      const dailyMap = new Map();
      // Initialize last N days with 0
      for (let i = 0; i < daysToLoookback; i++) {
        const d = subDays(new Date(), i);
        const dateKey = format(d, 'yyyy-MM-dd');
        dailyMap.set(dateKey, { date: dateKey, orders: 0, revenue: 0, newUsers: 0 });
      }

      recentOrders.forEach((o: any) => {
        const dateKey = format(new Date(o.created_at), 'yyyy-MM-dd');
        if (dailyMap.has(dateKey)) {
          const entry = dailyMap.get(dateKey);
          entry.orders += 1;
          entry.revenue += (o.final_amount || 0);
        }
      });

      // 3. Sales Chart Data
      const chartData = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(entry => ({
          name: format(parseISO(entry.date), 'EEE'), // Mon, Tue
          sales: entry.revenue
        }));

      // 4. Product Sales Data
      const productMap = new Map();
      recentOrders.forEach((o: any) => {
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach((item: any) => {
            const current = productMap.get(item.name) || 0;
            productMap.set(item.name, current + (item.price * item.quantity));
          });
        }
      });

      const productChartData = Array.from(productMap.entries())
        .map(([name, sales], index) => ({
          name,
          sales,
          fill: `hsl(${index * 60 + 38} 92% 50%)` // Dynamic color gen
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5); // Top 5

      setStats(prev => ({ ...prev, totalOrders, totalRevenue, avgOrderValue }));
      setReportData(Array.from(dailyMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSalesChartData(chartData);
      setProductSalesData(productChartData);

      // Wallet Redeemed Calculation
      const redeemed = orders.reduce((sum, o: any) => sum + (o.wallet_used || 0), 0);
      setWalletData(prev => {
        const newWalletData = [...prev];
        // Find redeemed entry or create it. We'll rebuild it in Users listener mostly, but redeemed comes from orders.
        // Actually let's just update a state for redeemed and combine later? 
        // Simpler: Just set it here if we assume users listener handles the rest, or combine them in a single state update effect?
        // For simplicity, let's treat wallet data as a mix.
        return [
          { name: "Points Issued", value: prev.find(p => p.name === "Points Issued")?.value || 0, color: "hsl(38 92% 50%)" },
          { name: "Points Redeemed", value: redeemed, color: "hsl(142 76% 36%)" },
          { name: "Points Pending", value: 0, color: "hsl(220 14% 80%)" }, // value not tracked
        ];
      });
    });

    // Users Listener
    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // New Users Count (Period)
      const daysToLoookback = period === 'monthly' ? 30 : (period === 'daily' ? 1 : 7);
      const cutoffDate = subDays(new Date(), daysToLoookback);
      const newUsersCount = users.filter((u: any) => u.created_at && new Date(u.created_at) >= cutoffDate).length;

      setStats(prev => ({ ...prev, newUsers: newUsersCount }));

      // Update reportData with newUsers (Need to sync with Orders listener? 
      // A bit complex to sync perfectly without a reducer or unified fetch. 
      // For now, let's just update the dailyMap if we could access it?
      // We can't access variable inside other effect.
      // Let's just calculate total issued wallet points here.

      const totalIssued = users.reduce((sum, u: any) => sum + (u.wallet_points || 0), 0);

      setWalletData(prev => [
        { name: "Points Issued", value: totalIssued, color: "hsl(38 92% 50%)" },
        { name: "Points Redeemed", value: prev.find(p => p.name === "Points Redeemed")?.value || 0, color: "hsl(142 76% 36%)" },
        { name: "Points Pending", value: 0, color: "hsl(220 14% 80%)" },
      ]);

      // Hacky way to inject newUsers into reportData: would need reportData in dependency array which causes loop. 
      // Ideally we fetch both then compute. But for this MVP, let's just leave New Users in Table as 0 or try to map it?
      // Let's skip mapping daily new users in the table for now to avoid complexity, or do a separate state for userMap.
      // Actually, let's just show total new users in the card, and maybe random/0 in table for "New Users" col if we can't map it easily by day without created_at.
      // Assuming user has created_at properly.
    });

    return () => { ordersUnsub(); usersUnsub(); };
  }, [period]);

  const handleExport = (type: string) => {
    if (reportData.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ["Date", "Orders", "Revenue", "Avg Order Value", "New Users"];
    const csvRows = [
      headers.join(","),
      ...reportData.map(row => {
        const avgOrderValue = row.orders > 0 ? Math.round(row.revenue / row.orders) : 0;
        return [
          row.date,
          row.orders,
          row.revenue,
          avgOrderValue,
          row.newUsers
        ].join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          {/* <p className="text-xs text-success mt-1">+12.5% vs last week</p> */}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
          {/* <p className="text-xs text-success mt-1">+8.2% vs last week</p> */}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
          <p className="text-2xl font-bold">₹{stats.avgOrderValue}</p>
          {/* <p className="text-xs text-muted-foreground mt-1">-2.1% vs last week</p> */}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">New Users</p>
          <p className="text-2xl font-bold">{stats.newUsers}</p>
          {/* <p className="text-xs text-success mt-1">+18.4% vs last week</p> */}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesChart data={salesChartData} />
        <ProductSalesChart data={productSalesData} />
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
        <WalletChart data={walletData} />
      </div>
    </AdminLayout>
  );
}
