import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Sparkline from "./Sparkline";
import StatusBadge, { type Status } from "./StatusBadge";
import CountUp from "./CountUp";
import type { ComponentType, SVGProps } from "react";

export interface KpiCardProps {
  title: string;
  value: string;
  supportingText?: string;
  status?: Status;
  trend?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  sparklineData?: number[];
  sparklineVariant?: "area" | "bar";
  sparklineColor?: string;
  className?: string;
  size?: "sm" | "md";
  /**
   * When provided, the entire card becomes a button that opens the
   * KpiInsightDrawer. Hovering reveals the "Explore" affordance.
   */
  onClick?: () => void;
}

export default function KpiCard({
  title,
  value,
  supportingText,
  status,
  icon: Icon,
  sparklineData,
  sparklineVariant = "area",
  sparklineColor,
  className,
  size = "md",
  onClick,
}: KpiCardProps) {
  const interactive = Boolean(onClick);
  const handleKey = interactive
    ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }
    : undefined;

  return (
    <motion.div
      whileHover={interactive ? { y: -3 } : { y: -2 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onKeyDown={handleKey}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `${title} — explore insight` : undefined}
      className={cn(
        "group relative flex flex-col rounded-lg border border-border bg-surface shadow-card transition",
        size === "sm" ? "p-3.5" : "px-3.5 py-3.5 min-h-[136px]",
        interactive
          ? "cursor-pointer hover:border-primaryBlue/40 hover:shadow-elevated focus:outline-none focus-visible:ring-4 focus-visible:ring-primaryBlue/20"
          : "hover:shadow-elevated",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {Icon ? (
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-surface-blue text-primaryBlue">
              <Icon className="h-3.5 w-3.5" />
            </span>
          ) : null}
          {/* Title is allowed to wrap to 2 lines so labels like
              "Catchments on Watch" or "Critical Work Orders" never truncate. */}
          <div
            className="min-w-0 flex-1 break-words text-[12px] font-semibold leading-[1.3] tracking-[0.01em] text-deepNavy"
            title={title}
          >
            {title}
          </div>
        </div>
        {status ? <StatusBadge status={status} size="sm" /> : null}
      </div>
      <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-deepNavy">
        <CountUp value={value} />
      </div>
      {supportingText ? (
        <div className="mt-1 text-[11.5px] leading-[1.35] text-ink-muted">
          {supportingText}
        </div>
      ) : null}
      {sparklineData ? (
        <div className="mt-auto pt-2 -mb-1">
          <Sparkline
            data={sparklineData}
            stroke={sparklineColor ?? "#00AEEF"}
            height={28}
            variant={sparklineVariant}
          />
        </div>
      ) : null}

      {interactive ? (
        <span
          className="pointer-events-none absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-deepNavy/90 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-white shadow-soft opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        >
          <Sparkles className="h-3 w-3" />
          Ask AquaIQ
        </span>
      ) : null}
    </motion.div>
  );
}
