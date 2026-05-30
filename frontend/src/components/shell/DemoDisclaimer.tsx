import { Info } from "lucide-react";

export default function DemoDisclaimer() {
  return (
    <div className="flex h-8 flex-none items-center border-t border-border bg-surface-blue/50 px-6 text-[11px] text-ink-secondary lg:px-8">
      <div className="flex w-full flex-nowrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5">
          <Info className="h-3 w-3 text-primaryBlue" />
          <span>Demo data only. Not for operational decisioning.</span>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primaryBlue hover:text-deepBlue"
        >
          Learn more
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
