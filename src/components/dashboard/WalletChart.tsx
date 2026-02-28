import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface WalletChartProps {
  data: { name: string; value: number; color: string }[];
}

// Override with palette colors regardless of passed-in color prop
const WALLET_COLORS = ["#63020c", "#1DB954", "#fdf8e4"];
const BORDER_COLOR = "hsl(40 60% 86%)";

export function WalletChart({ data = [] }: WalletChartProps) {
  return (
    <div className="chart-container animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Wallet Points Overview</h3>
        <p className="text-sm text-muted-foreground">Issued vs Redeemed points</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={WALLET_COLORS[index % WALLET_COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fdf8e4",
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: "10px",
                boxShadow: "0 4px 16px rgba(99,2,12,0.12)",
                color: "#200f0f",
              }}
              formatter={(value: number) => [value.toLocaleString(), "Points"]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground font-medium">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
