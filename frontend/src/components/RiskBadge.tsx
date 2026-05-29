import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  band: string;
  size?: "sm" | "md";
  className?: string;
}

const STYLES: Record<string, string> = {
  Critical: "bg-risk-500/20 text-risk-200 border-risk-500/40",
  High: "bg-amberop-500/20 text-amberop-100 border-amberop-500/40",
  Medium: "bg-water-500/20 text-water-100 border-water-500/40",
  Low: "bg-catchment-500/20 text-catchment-100 border-catchment-500/40",
  Coordinate: "bg-risk-500/25 text-risk-100 border-risk-500/40",
  Respond: "bg-amberop-500/25 text-amberop-100 border-amberop-500/40",
  Watch: "bg-water-500/25 text-water-100 border-water-500/40",
  Routine: "bg-catchment-500/20 text-catchment-100 border-catchment-500/40",
  Elevated: "bg-amberop-500/25 text-amberop-100 border-amberop-500/40",
  Normal: "bg-catchment-500/20 text-catchment-100 border-catchment-500/40",
};

export default function RiskBadge({ band, size = "sm", className }: RiskBadgeProps) {
  const style = STYLES[band] ?? "bg-white/10 text-ink-100 border-white/15";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {band}
    </span>
  );
}
