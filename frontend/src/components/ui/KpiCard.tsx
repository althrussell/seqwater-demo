import { motion } from "framer-motion";
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
}: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group flex flex-col rounded-lg border border-border bg-surface shadow-card transition hover:shadow-elevated",
        size === "sm" ? "p-3.5" : "p-4 min-h-[148px]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {Icon ? (
            <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md bg-surface-blue text-primaryBlue">
              <Icon className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <div className="min-w-0 text-[12.5px] font-medium leading-[1.25] text-ink-secondary">
            {title}
          </div>
        </div>
        {status ? <StatusBadge status={status} size="sm" /> : null}
      </div>
      <div className="mt-2.5 text-[30px] font-semibold leading-none tracking-tight text-deepNavy">
        <CountUp value={value} />
      </div>
      {supportingText ? (
        <div className="mt-1.5 text-[12px] text-ink-muted">{supportingText}</div>
      ) : null}
      {sparklineData ? (
        <div className="mt-auto pt-2.5 -mb-1">
          <Sparkline
            data={sparklineData}
            stroke={sparklineColor ?? "#00AEEF"}
            height={36}
            variant={sparklineVariant}
          />
        </div>
      ) : null}
    </motion.div>
  );
}
