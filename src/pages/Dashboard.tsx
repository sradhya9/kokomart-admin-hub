import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { ProductSalesChart } from "@/components/dashboard/ProductSalesChart";
import { WalletChart } from "@/components/dashboard/WalletChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { ShoppingCart, IndianRupee, Clock, Users } from "lucide-react";
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subDays, format, parseISO, startOfDay } from "date-fns";

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    totalRevenueToday: 0,
    pendingOrders: 0,
    totalUsers: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);
  const [productSalesData, setProductSalesData] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any[]>([
    { name: "Points Issued", value: 0, color: "hsl(38 92% 50%)" },
    { name: "Points Redeemed", value: 0, color: "hsl(142 76% 36%)" },
    { name: "Points Pending", value: 0, color: "hsl(220 14% 80%)" },
  ]);

  useEffect(() => {
    // Users Listener
    const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));

      const totalIssued = snapshot.docs.map(doc => doc.data()).reduce((sum, u: any) => sum + (u.wallet_points || 0), 0);
      setWalletData(prev => {
        const newData = [...prev];
        newData[0] = { ...newData[0], value: totalIssued };
        return newData;
      });
    });

    // Orders Listener (Active/Recent)
    // We fetch all orders for today stats to avoid complex multiple queries for now, 
    // or create specific queries. Given it's a dashboard, listening to 'orders' is common.
    // However, for scalability, we should use specific queries.
    // Let's do separate listeners for specific metrics to be safe.

    // 1. Orders Listener (Last 7 Days for Charts + Today Stats)
    const sevenDaysAgo = subDays(startOfDay(new Date()), 7).getTime();

    // Using a broader query for charts
    const ordersQuery = query(
      collection(db, "orders"),
      where("created_at", ">=", sevenDaysAgo)
    );

    const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      const todayStart = startOfDay(new Date()).getTime();

      // Today's Stats
      let revenueToday = 0;
      let ordersToday = 0;
      let redeemedTotal = 0;

      // Chart Data preparation helpers
      const dailyMap = new Map();
      const productMap = new Map();

      // Init last 7 days for Sales Chart
      for (let i = 0; i < 7; i++) {
        const d = subDays(new Date(), i);
        const dateKey = format(d, 'yyyy-MM-dd');
        dailyMap.set(dateKey, { date: dateKey, sales: 0 });
      }

      orders.forEach((data: any) => {
        const createdAt = data.created_at;
        redeemedTotal += (data.wallet_used || 0);

        // Today Stats
        if (createdAt >= todayStart) {
          revenueToday += (data.final_amount || 0);
          ordersToday += 1;
        }

        // Sales Chart (Daily)
        const dateKey = format(new Date(createdAt), 'yyyy-MM-dd');
        if (dailyMap.has(dateKey)) {
          dailyMap.get(dateKey).sales += (data.final_amount || 0);
        }

        // Product Sales Chart
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((item: any) => {
            const current = productMap.get(item.name) || 0;
            productMap.set(item.name, current + (item.price * item.quantity));
          });
        }
      });

      setStats(prev => ({
        ...prev,
        totalOrdersToday: ordersToday,
        totalRevenueToday: revenueToday
      }));

      // Set Sales Chart Data
      const salesData = Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(entry => ({
          name: format(parseISO(entry.date), 'EEE'),
          sales: entry.sales
        }));
      setSalesChartData(salesData);

      // Set Product Sales Data
      const productData = Array.from(productMap.entries())
        .map(([name, sales], index) => ({
          name,
          sales,
          fill: `hsl(${index * 60 + 38} 92% 50%)`
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
      setProductSalesData(productData);

      // Update Wallet Redeemed
      setWalletData(prev => {
        const newData = [...prev];
        newData[1] = { ...newData[1], value: redeemedTotal };
        return newData;
      });
    });

    // 2. Pending Orders
    const pendingQuery = query(collection(db, "orders"), where("status", "==", "pending"));
    const pendingUnsub = onSnapshot(pendingQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingOrders: snapshot.size }));
    });

    // 3. Recent Orders
    const recentQuery = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(5));
    const recentUnsub = onSnapshot(recentQuery, (snapshot) => {
      const processOrders = async () => {
        const processed = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let customerName = "Unknown";
          if (data.user_id) {
            // We could cache this or uses a separate listener. 
            // For 5 items, getDoc is fine.
            try {
              const userQuery = query(collection(db, "users"), where("id", "==", data.user_id));
              const userDoc = await getDocs(userQuery);
              if (!userDoc.empty) {
                customerName = userDoc.docs[0].data().name;
              }
            } catch (e) { console.error(e); }
          }

          // format time
          const date = new Date(data.created_at);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: doc.id,
            customer: customerName,
            amount: data.final_amount,
            status: data.status,
            time: timeString
          };
        }));
        setRecentOrders(processed);
      };
      processOrders();
    });

    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Auto refresh every 30 seconds

    return () => {
      clearInterval(interval);
      usersUnsub();
      ordersUnsub();
      pendingUnsub();
      recentUnsub();
    };
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
          value={stats.totalOrdersToday.toString()}
          change={{ value: 0, type: "neutral" }} // We don't have historical data easily yet for change calc
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Revenue (Today)"
          value={`₹${stats.totalRevenueToday.toLocaleString()}`}
          change={{ value: 0, type: "neutral" }}
          icon={IndianRupee}
          iconColor="bg-success/10 text-success"
        />
        <MetricCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          change={{ value: 0, type: "neutral" }}
          icon={Clock}
          iconColor="bg-warning/10 text-warning"
        />
        <MetricCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={{ value: 0, type: "neutral" }}
          icon={Users}
          iconColor="bg-chart-3/10 text-chart-3"
        />
      </div>

      {/* Charts Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SalesChart data={salesChartData} />
        <ProductSalesChart data={productSalesData} />
      </div>

      {/* Bottom Section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <WalletChart data={walletData} />
      </div>
    </AdminLayout>
  );
}
