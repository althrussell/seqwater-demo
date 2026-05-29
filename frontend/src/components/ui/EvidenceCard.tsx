import { useState } from "react";
import {
  ChevronDown,
  Database,
  FileText,
  GitBranch,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SourceType = "table" | "document" | "workflow" | "model" | "view";
export type Confidence = "low" | "medium" | "high";

export interface EvidenceCardProps {
  sourceName: string;
  sourceType: SourceType;
  usedFor: string;
  confidence: Confidence;
  detail?: string;
}

const TYPE_META: Record<SourceType, { icon: typeof Database; label: string }> = {
  table: { icon: Database, label: "Unity Catalog table" },
  document: { icon: FileText, label: "Governed document" },
  workflow: { icon: GitBranch, label: "Workflow" },
  model: { icon: Sparkles, label: "Model output" },
  view: { icon: LayoutGrid, label: "Catalog view" },
};

const CONFIDENCE_META: Record<Confidence, string> = {
  low: "pill bg-[#FCE5DA] text-status-escalate",
  medium: "pill bg-[#FFF4E0] text-status-watch",
  high: "pill bg-surface-green text-greenDark",
};

export default function EvidenceCard({
  sourceName,
  sourceType,
  usedFor,
  confidence,
  detail,
}: EvidenceCardProps) {
  const [open, setOpen] = useState(false);
  const meta = TYPE_META[sourceType];
  const Icon = meta.icon;
  return (
    <div className="rounded-md border border-border bg-surface p-3 shadow-soft transition hover:border-primaryBlue/30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2.5 text-left"
      >
        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded bg-surface-blue text-primaryBlue">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-semibold text-deepNavy">{sourceName}</div>
            <span className={cn(CONFIDENCE_META[confidence], "capitalize")}>{confidence}</span>
          </div>
          <div className="mt-0.5 text-[11.5px] uppercase tracking-wider text-ink-muted">
            {meta.label}
          </div>
          <div className="mt-1.5 text-[12.5px] text-ink-secondary">{usedFor}</div>
        </div>
        {detail ? (
          <ChevronDown
            className={cn(
              "mt-1 h-4 w-4 flex-none text-ink-muted transition-transform",
              open && "rotate-180",
            )}
          />
        ) : null}
      </button>
      {open && detail ? (
        <p className="mt-2 rounded bg-surface-blue/50 p-2.5 text-[12px] leading-relaxed text-ink-secondary animate-fadeIn">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
