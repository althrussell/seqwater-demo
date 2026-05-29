import {
  AlertTriangle,
  Building2,
  Droplet,
  CircleDot,
  Square,
  Minus,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface LegendItem {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
  fill?: string;
}

const ITEMS: LegendItem[] = [
  { label: "Dam / Reservoir", icon: Droplet, color: "#0076BE" },
  { label: "Water Treatment Plant", icon: Building2, color: "#2E7D59" },
  { label: "Pump Station", icon: CircleDot, color: "#0076BE" },
  { label: "Pipeline", icon: Minus, color: "#0076BE" },
  { label: "Reservoir", icon: Square, color: "#0076BE" },
  { label: "Alert / Watch", icon: AlertTriangle, color: "#D88A00" },
  { label: "Quality Alert", icon: Droplet, color: "#7C3AED" },
  { label: "Catchment Area", icon: Square, color: "#5FA777", fill: "#EEF8F2" },
];

export default function MapLegend({
  title = "Map Key",
  items = ITEMS,
  className,
}: {
  title?: string;
  items?: LegendItem[];
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-md border border-border bg-surface/95 px-3 py-2.5 text-[11.5px] text-ink-secondary shadow-card backdrop-blur " +
        (className ?? "")
      }
    >
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-deepNavy">
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span
              className="flex h-4 w-4 flex-none items-center justify-center rounded-sm"
              style={{ background: it.fill ?? "transparent", color: it.color }}
            >
              <it.icon className="h-3.5 w-3.5" />
            </span>
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RainfallLegend({ className }: { className?: string }) {
  return (
    <div
      className={
        "rounded-md border border-border bg-surface/95 px-3 py-2.5 text-[11.5px] text-ink-secondary shadow-card backdrop-blur " +
        (className ?? "")
      }
    >
      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-deepNavy">
        Rainfall (mm)
      </div>
      <div className="mb-1 text-[10.5px] text-ink-muted">Next 72 hours</div>
      <div
        className="h-2 rounded"
        style={{
          background:
            "linear-gradient(90deg,#EEF8F2 0%,#D8F0FB 25%,#86CFE5 45%,#5FA777 60%,#D88A00 78%,#C2410C 100%)",
        }}
      />
      <div className="mt-1 flex justify-between text-[10.5px] text-ink-muted">
        <span>1</span>
        <span>10</span>
        <span>25</span>
        <span>50</span>
        <span>100</span>
        <span>150+</span>
      </div>
    </div>
  );
}
