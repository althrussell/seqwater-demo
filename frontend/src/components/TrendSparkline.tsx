import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendSparklineProps {
  data: { x: string | number; y: number }[];
  height?: number;
  stroke?: string;
  fill?: string;
  yLabel?: string;
}

export default function TrendSparkline({
  data,
  height = 60,
  stroke = "#FF8E76",
  fill = "url(#sparkfill)",
  yLabel,
}: TrendSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[60px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 text-[11px] text-ink-300">
        No synthetic data
      </div>
    );
  }
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.55} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="x" hide />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              background: "#15161A",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#A8A29E" }}
            itemStyle={{ color: "#FF8E76" }}
            formatter={(v: number) =>
              yLabel ? [`${typeof v === "number" ? v.toFixed(2) : v}`, yLabel] : v
            }
          />
          <Area
            dataKey="y"
            type="monotone"
            stroke={stroke}
            strokeWidth={1.6}
            fill={fill}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
