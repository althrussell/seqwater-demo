import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScenarioOption {
  id: string;
  label: string;
  description?: string;
}

export const DEFAULT_SCENARIOS: ScenarioOption[] = [
  {
    id: "72h-rainfall-watch",
    label: "72-hour rainfall watch",
    description: "Elevated rainfall forecast across 3 catchments",
  },
  {
    id: "summer-heatwave",
    label: "Summer heatwave",
    description: "Demand surge with depleted storage",
  },
  {
    id: "supply-restoration",
    label: "Supply restoration drill",
    description: "Treatment outage and rebalancing",
  },
  {
    id: "baseline",
    label: "Baseline operating posture",
    description: "Steady-state profile",
  },
];

interface Props {
  value: string;
  onChange: (id: string) => void;
  options?: ScenarioOption[];
}

export default function ScenarioSelector({
  value,
  onChange,
  options = DEFAULT_SCENARIOS,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-deepNavy transition hover:border-primaryBlue/40 hover:bg-surface-blue/40",
          open && "border-primaryBlue/40 bg-surface-blue/60",
        )}
      >
        <CloudRain className="h-4 w-4 text-primaryBlue" />
        <span className="text-ink-muted">Scenario:</span>
        <span>{selected.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="absolute right-0 z-[1100] mt-2 w-[320px] overflow-hidden rounded-lg border border-border bg-surface shadow-elevated animate-fadeIn">
          <ul role="listbox" className="py-1">
            {options.map((opt) => {
              const active = opt.id === value;
              return (
                <li key={opt.id}>
                  <button
                    onClick={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-surface-blue/60",
                      active && "bg-surface-blue/40",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 flex-none",
                        active ? "text-primaryBlue" : "text-transparent",
                      )}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-deepNavy">{opt.label}</div>
                      {opt.description ? (
                        <div className="text-[12px] text-ink-muted">{opt.description}</div>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
