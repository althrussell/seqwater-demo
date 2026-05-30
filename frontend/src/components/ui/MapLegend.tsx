import { AlertTriangle, Building2, Droplet } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type LegendKind = "dam" | "wtp" | "pump" | "alert" | "quality" | "catchment" | "pipeline";

interface LegendItem {
  label: string;
  kind: LegendKind;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

const ITEMS: LegendItem[] = [
  { label: "Dam / reservoir", kind: "dam", icon: Droplet },
  { label: "Water treatment plant", kind: "wtp", icon: Building2 },
  { label: "Pump station", kind: "pump" },
  { label: "Pipeline", kind: "pipeline" },
  { label: "Alert / watch", kind: "alert", icon: AlertTriangle },
  { label: "Quality alert", kind: "quality", icon: Droplet },
  { label: "Catchment area", kind: "catchment" },
];

function LegendChip({ kind, Icon }: { kind: LegendKind; Icon?: ComponentType<SVGProps<SVGSVGElement>> }) {
  if (kind === "dam") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] border-primaryBlue bg-white text-primaryBlue shadow-soft">
        {Icon ? <Icon className="h-2.5 w-2.5" /> : null}
      </span>
    );
  }
  if (kind === "wtp") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] border-greenDark bg-white text-greenDark shadow-soft">
        {Icon ? <Icon className="h-2.5 w-2.5" /> : null}
      </span>
    );
  }
  if (kind === "pump") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] border-white bg-primaryBlue text-white shadow-soft ring-1 ring-primaryBlue/30">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    );
  }
  if (kind === "alert") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] border-white bg-status-watch text-white shadow-soft">
        {Icon ? <Icon className="h-2.5 w-2.5" /> : null}
      </span>
    );
  }
  if (kind === "quality") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border-[1.5px] border-white bg-[#7C3AED] text-white shadow-soft">
        {Icon ? <Icon className="h-2.5 w-2.5" /> : null}
      </span>
    );
  }
  if (kind === "pipeline") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center" aria-hidden>
        <span
          className="h-[2px] w-4 rounded-full bg-primaryBlue"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg,#0076BE 0,#0076BE 4px,transparent 4px,transparent 7px)",
          }}
        />
      </span>
    );
  }
  // catchment
  return (
    <span
      className="flex h-5 w-5 flex-none items-center justify-center rounded-sm border border-greenDark/40"
      style={{ background: "rgba(95,167,119,0.18)" }}
      aria-hidden
    />
  );
}

export default function MapLegend({
  title = "Map key",
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
        "rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[11.5px] font-medium text-deepNavy shadow-elevated " +
        (className ?? "")
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-deepNavy">
          {title}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <LegendChip kind={it.kind} Icon={it.icon} />
            <span className="leading-tight">{it.label}</span>
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
        "rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-[11.5px] font-medium text-deepNavy shadow-elevated " +
        (className ?? "")
      }
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-deepNavy">
        Rainfall (mm)
      </div>
      <div className="mb-1 text-[10.5px] text-ink-secondary">Next 72 hours</div>
      <div
        className="h-2 rounded"
        style={{
          background:
            "linear-gradient(90deg,#EEF8F2 0%,#D8F0FB 25%,#86CFE5 45%,#5FA777 60%,#D88A00 78%,#C2410C 100%)",
        }}
      />
      <div className="mt-1 flex justify-between text-[10.5px] font-semibold text-deepNavy">
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
