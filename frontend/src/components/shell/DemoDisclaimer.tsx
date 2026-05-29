import { Info } from "lucide-react";

export default function DemoDisclaimer() {
  return (
    <div className="border-t border-border bg-surface-blue/50 px-6 py-2 text-[12px] text-ink-secondary lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-primaryBlue" />
          <span>
            Synthetic demo data only. Not for operational decisioning.
          </span>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-primaryBlue hover:text-deepBlue"
        >
          Learn more
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
