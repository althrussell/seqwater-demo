import { ChevronRight, Database, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";
import StatusBadge, { type Status } from "./StatusBadge";

interface Props {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  status?: Status;
  /** Override the chip label (e.g. "Review") while keeping the status colour. */
  chipLabel?: string;
  /** Optional short evidence label rendered as a subtle source chip. */
  evidenceLabel?: string;
  evidenceType?: "table" | "document";
  onClick?: () => void;
}

const STATUS_RING: Record<Status, string> = {
  normal: "bg-surface-green text-greenDark",
  monitor: "bg-surface-blue text-primaryBlue",
  watch: "bg-[#FFF4E0] text-status-watch",
  escalate: "bg-[#FCE5DA] text-status-escalate",
};

export default function ExecutivePriorityCard({
  title,
  description,
  icon: Icon,
  status = "monitor",
  chipLabel,
  evidenceLabel,
  evidenceType = "table",
  onClick,
}: Props) {
  const EvidenceIcon = evidenceType === "document" ? FileText : Database;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="group flex w-full items-center gap-3.5 rounded-lg border border-border bg-surface px-4 py-3 text-left transition hover:border-primaryBlue/40 hover:shadow-card"
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-none items-center justify-center rounded-lg",
          STATUS_RING[status],
        )}
      >
        <Icon className="h-[16px] w-[16px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate text-[13.5px] font-semibold leading-snug text-deepNavy">
            {title}
          </div>
          <StatusBadge status={status} label={chipLabel} size="sm" />
        </div>
        <div className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-ink-muted">
          {description}
        </div>
        {evidenceLabel ? (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-ink-muted">
            <EvidenceIcon className="h-3 w-3 text-primaryBlue/80" />
            <span className="truncate">{evidenceLabel}</span>
          </div>
        ) : null}
      </div>
      <ChevronRight className="h-4 w-4 flex-none text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primaryBlue" />
    </motion.button>
  );
}
