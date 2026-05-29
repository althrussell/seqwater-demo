import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GovernanceColumn {
  title: string;
  items: string[];
  icon?: React.ReactNode;
}

interface Props {
  columns: GovernanceColumn[];
  highlightColumn?: string;
  className?: string;
}

export default function GovernanceFlow({ columns, highlightColumn, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5 lg:gap-2">
        {columns.map((col, idx) => {
          const isHighlight = col.title === highlightColumn;
          return (
            <motion.div
              key={col.title}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "relative flex flex-col rounded-lg border bg-surface px-4 py-4 shadow-card transition",
                isHighlight
                  ? "border-databricks-red/40 ring-2 ring-databricks-red/20"
                  : "border-border hover:border-primaryBlue/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Step {idx + 1}
                </div>
                {col.icon}
              </div>
              <div className="mt-1 text-[14.5px] font-semibold leading-snug text-deepNavy">
                {col.title}
              </div>
              <ul className="mt-3 space-y-1.5">
                {col.items.map((it) => (
                  <li
                    key={it}
                    className="rounded-md border border-border/70 bg-canvas/60 px-2.5 py-1.5 text-[12px] text-ink-secondary transition hover:border-primaryBlue/30 hover:bg-surface-blue hover:text-deepBlue"
                  >
                    {it}
                  </li>
                ))}
              </ul>
              {idx < columns.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-muted lg:block" />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
