import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Activity,
  Droplets,
  Gauge,
  Hammer,
  ShieldCheck,
  TrendingDown,
  Wrench,
  CloudRain,
} from "lucide-react";

interface ExecutiveKpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  status?: "ok" | "watch" | "elevated" | "critical";
  delta?: string;
  icon?: string;
  trend?: { x: string; y: number }[];
}

const ICONS: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  droplets: Droplets,
  gauge: Gauge,
  alert: AlertTriangle,
  activity: Activity,
  hammer: Hammer,
  wrench: Wrench,
  rain: CloudRain,
  trend: TrendingDown,
};

const STATUS_TONES: Record<string, { ring: string; glow: string; tag: string; dot: string }> = {
  ok: {
    ring: "border-catchment-500/30",
    glow: "from-catchment-500/0 via-catchment-500/0 to-catchment-500/[0.05]",
    tag: "bg-catchment-500/15 text-catchment-100 border-catchment-500/30",
    dot: "bg-catchment-400 shadow-[0_0_12px_3px_rgba(105,177,71,0.45)]",
  },
  watch: {
    ring: "border-water-500/30",
    glow: "from-water-500/0 via-water-500/0 to-water-500/[0.06]",
    tag: "bg-water-500/15 text-water-100 border-water-500/30",
    dot: "bg-water-400 shadow-[0_0_12px_3px_rgba(63,161,242,0.45)]",
  },
  elevated: {
    ring: "border-amberop-500/30",
    glow: "from-amberop-500/0 via-amberop-500/0 to-amberop-500/[0.08]",
    tag: "bg-amberop-500/15 text-amberop-100 border-amberop-500/30",
    dot: "bg-amberop-400 shadow-[0_0_14px_3px_rgba(255,163,26,0.45)]",
  },
  critical: {
    ring: "border-risk-500/40",
    glow: "from-risk-500/0 via-risk-500/0 to-risk-500/[0.10]",
    tag: "bg-risk-500/15 text-risk-100 border-risk-500/30",
    dot: "bg-risk-400 shadow-[0_0_14px_3px_rgba(212,62,44,0.55)]",
  },
};

export default function ExecutiveKpiCard({
  label,
  value,
  sublabel,
  status = "ok",
  delta,
  icon = "gauge",
  trend,
}: ExecutiveKpiCardProps) {
  const tone = STATUS_TONES[status] ?? STATUS_TONES.ok;
  const Icon = ICONS[icon] ?? Gauge;

  return (
    <div className={cn("kpi-card group", tone.ring)}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity",
          tone.glow,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", tone.dot, "animate-pulseSoft")} />
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-200">
              {label}
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-ink-50">
            {value}
          </div>
          {sublabel ? (
            <div className="mt-1 text-xs text-ink-300">{sublabel}</div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border bg-white/5",
            tone.ring,
          )}
        >
          <Icon className="h-4 w-4 text-ink-100" />
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between">
        <span className={cn("pill", tone.tag)}>{status}</span>
        {delta ? (
          <span className="text-[11px] text-ink-300">{delta}</span>
        ) : null}
      </div>

      {trend && trend.length > 1 ? (
        <Sparkline points={trend} />
      ) : null}
    </div>
  );
}

function Sparkline({ points }: { points: { x: string; y: number }[] }) {
  if (!points.length) return null;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const w = 220;
  const h = 36;
  const step = w / Math.max(points.length - 1, 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p.y - min) / span) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="relative mt-3 h-10 w-full opacity-90">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="kpi-spark" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FF5F3D" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FF5F3D" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#kpi-spark)" />
        <path d={path} fill="none" stroke="#FF8E76" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
