import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ProductSalesChartProps {
  data: { name: string; sales: number; fill?: string }[];
}

const BORDER_COLOR = "hsl(40 60% 86%)";
const AXIS_COLOR = "hsl(5 30% 55%)";

// Red/maroon palette variants for bar chart
const BAR_COLORS = [
  "#63020c", // deep red
  "#8f0503", // mid red
  "#74111B", // deep teal dark
  "#c70404", // extrared
  "#4d0808", // darkest maroon
];

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
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER_COLOR} horizontal={false} />
            <XAxis
              type="number"
              stroke={AXIS_COLOR}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke={AXIS_COLOR}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fdf8e4",
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: "10px",
                boxShadow: "0 4px 16px rgba(99,2,12,0.12)",
                color: "#200f0f",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
            />
            <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
