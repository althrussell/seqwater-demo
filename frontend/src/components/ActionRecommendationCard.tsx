import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActionRecommendationCard({
  actions,
  className,
}: {
  actions: string[];
  className?: string;
}) {
  if (!actions || actions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-ink-300",
          className,
        )}
      >
        No recommended actions in this synthetic snapshot.
      </div>
    );
  }
  return (
    <ol className={cn("space-y-2", className)}>
      {actions.map((a, i) => (
        <li
          key={i}
          className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 transition hover:border-brand-400/20 hover:bg-brand-500/[0.04]"
        >
          <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-[11px] font-semibold text-ink-100">
            {i + 1}
          </div>
          <div className="flex-1 text-sm leading-relaxed text-ink-100">{a}</div>
          <ChevronRight className="mt-1 h-4 w-4 flex-none text-ink-300 opacity-0 transition group-hover:opacity-100" />
        </li>
      ))}
      <li className="mt-2 flex items-center gap-2 text-[11px] text-ink-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-catchment-400" />
        <span>
          Each action is a synthetic recommendation. Human validation is required
          before acting.
        </span>
      </li>
    </ol>
  );
}
