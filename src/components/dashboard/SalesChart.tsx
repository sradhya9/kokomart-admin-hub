import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SalesChartProps {
  data: { name: string; sales: number }[];
}

// Red/maroon palette colors
const DEEP_RED = "#63020c";
const MID_RED = "#8f0503";
const BORDER_COLOR = "hsl(40 60% 86%)";
const AXIS_COLOR = "hsl(5 30% 55%)";

export function SalesChart({ data = [] }: SalesChartProps) {
  return (
    <div className="chart-container animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Daily Sales</h3>
        <p className="text-sm text-muted-foreground">Revenue over the last 7 days</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DEEP_RED} stopOpacity={0.35} />
                <stop offset="95%" stopColor={MID_RED} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER_COLOR} />
            <XAxis
              dataKey="name"
              stroke={AXIS_COLOR}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={AXIS_COLOR}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
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
            <Area
              type="monotone"
              dataKey="sales"
              stroke={DEEP_RED}
              strokeWidth={2.5}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
