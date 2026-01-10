import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProductSalesChartProps {
  data: { name: string; sales: number; fill?: string }[];
}

export function ProductSalesChart({ data = [] }: ProductSalesChartProps) {
  return (
    <div className="chart-container animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Product-wise Sales</h3>
        <p className="text-sm text-muted-foreground">Revenue by product category</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" horizontal={false} />
            <XAxis
              type="number"
              stroke="hsl(220 9% 46%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="hsl(220 9% 46%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0 0% 100%)",
                border: "1px solid hsl(220 13% 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="sales" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
