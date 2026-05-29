import { cn } from "@/lib/utils";
import { Eye, ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type Status = "normal" | "monitor" | "watch" | "escalate";

interface Props {
  status: Status;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const META: Record<
  Status,
  { label: string; cls: string; dot: string; icon: ComponentType<SVGProps<SVGSVGElement>> }
> = {
  normal: {
    label: "Normal",
    cls: "bg-surface-green text-greenDark",
    dot: "bg-status-normal",
    icon: ShieldCheck,
  },
  monitor: {
    label: "Monitor",
    cls: "bg-surface-blue text-primaryBlue",
    dot: "bg-status-monitor",
    icon: Eye,
  },
  watch: {
    label: "Watch",
    cls: "bg-[#FFF4E0] text-status-watch",
    dot: "bg-status-watch",
    icon: AlertTriangle,
  },
  escalate: {
    label: "Escalate",
    cls: "bg-[#FCE5DA] text-status-escalate",
    dot: "bg-status-escalate",
    icon: AlertOctagon,
  },
};

export default function StatusBadge({
  status,
  label,
  className,
  size = "md",
  showIcon = false,
}: Props) {
  const meta = META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]",
        meta.cls,
        className,
      )}
    >
      {showIcon ? (
        <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      )}
      {label ?? meta.label}
    </span>
  );
}
