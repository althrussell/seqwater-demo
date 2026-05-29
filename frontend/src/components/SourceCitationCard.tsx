import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { Citation } from "@/lib/types";

export default function SourceCitationCard({
  citations,
  className,
}: {
  citations: Citation[];
  className?: string;
}) {
  if (!citations || citations.length === 0) {
    return null;
  }
  return (
    <div className={cn("space-y-2", className)}>
      {citations.map((c, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-ink-200"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-mono text-[11px] font-semibold text-ink-100">
              {c.source}
            </div>
            {c.href ? (
              <ExternalLink className="h-3 w-3 flex-none text-ink-300" />
            ) : null}
          </div>
          <p className="mt-1 leading-relaxed text-ink-300">{c.detail}</p>
        </div>
      ))}
    </div>
  );
}
