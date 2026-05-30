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
    <div className={cn("relative h-full min-h-0", className)}>
      <div className="grid h-full min-h-0 grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
        {columns.map((col, idx) => {
          const isHighlight = col.title === highlightColumn;
          return (
            <motion.div
              key={col.title}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "relative flex min-h-0 flex-col overflow-hidden rounded-lg border bg-surface px-2.5 py-2.5 shadow-card transition",
                isHighlight
                  ? "border-databricks-red/40 ring-2 ring-databricks-red/20"
                  : "border-border hover:border-primaryBlue/40",
              )}
            >
              <div className="flex flex-none items-center justify-between gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  Step {idx + 1}
                </div>
                {col.icon}
              </div>
              <div className="mt-0.5 line-clamp-2 flex-none text-[12.5px] font-semibold leading-snug text-deepNavy">
                {col.title}
              </div>
              <ul className="scrollbar-clean mt-1.5 min-h-0 flex-1 space-y-1 overflow-auto pr-1">
                {col.items.map((it) => (
                  <li
                    key={it}
                    className="line-clamp-2 rounded-md border border-border/70 bg-canvas/60 px-2 py-1 text-[11px] text-ink-secondary transition hover:border-primaryBlue/30 hover:bg-surface-blue hover:text-deepBlue"
                    title={it}
                  >
                    {it}
                  </li>
                ))}
              </ul>
              {idx < columns.length - 1 ? (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-ink-muted lg:block" />
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
