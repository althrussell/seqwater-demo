import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";
import type { Status } from "./StatusBadge";

interface Props {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  status?: Status;
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
  onClick,
}: Props) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="group flex w-full items-center gap-3.5 rounded-lg border border-border bg-surface px-4 py-3.5 text-left transition hover:border-primaryBlue/40 hover:shadow-card"
    >
      <span
        className={cn(
          "flex h-10 w-10 flex-none items-center justify-center rounded-lg",
          STATUS_RING[status],
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold leading-snug text-deepNavy">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">{description}</div>
      </div>
      <ChevronRight className="h-4 w-4 flex-none text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primaryBlue" />
    </motion.button>
  );
}
