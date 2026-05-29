import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export default function SyntheticDataBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-amberop-400/20 bg-amberop-400/[0.06] px-3 py-1.5 text-xs text-amberop-100",
        className,
      )}
    >
      <ShieldAlert className="h-3.5 w-3.5 flex-none" />
      <span className="font-medium tracking-wide uppercase text-[10px]">
        Synthetic demo data
      </span>
      <span className="text-amberop-100/80">
        for illustration only — not real Seqwater data and not for operational use.
      </span>
    </div>
  );
}
