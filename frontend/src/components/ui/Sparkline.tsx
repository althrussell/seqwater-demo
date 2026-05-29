import { Area, AreaChart, ResponsiveContainer, Bar, BarChart } from "recharts";

interface Props {
  data: number[];
  stroke?: string;
  fill?: string;
  height?: number;
  variant?: "area" | "bar";
}

export default function Sparkline({
  data,
  stroke = "#00AEEF",
  fill,
  height = 32,
  variant = "area",
}: Props) {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="rounded bg-surface-blue/40" />;
  }
  const series = data.map((y, i) => ({ x: i, y }));

  if (variant === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Bar dataKey="y" fill={stroke} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  const gradId = `spark-${stroke.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill ?? stroke} stopOpacity={0.32} />
            <stop offset="100%" stopColor={fill ?? stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="y"
          stroke={stroke}
          strokeWidth={1.75}
          fill={`url(#${gradId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
