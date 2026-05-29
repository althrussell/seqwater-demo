/**
 * Map style + projection + 3D toggles. Renders a small chip that opens a popover
 * with the full Mapbox catalog, a "Custom URL" field, and switches for terrain,
 * 3D buildings, and globe projection.
 */
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Check,
  ChevronDown,
  Globe2,
  Layers,
  Map as MapIcon,
  Mountain,
  Pencil,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { MAPBOX_STYLES, type MapStyleOption, type ProjectionId } from "./mapStyles";

interface Props {
  styleUrl: string;
  onStyleChange: (url: string) => void;
  projection: ProjectionId;
  onProjectionChange: (p: ProjectionId) => void;
  terrain: boolean;
  onTerrainChange: (v: boolean) => void;
  buildings: boolean;
  onBuildingsChange: (v: boolean) => void;
  className?: string;
}

export default function MapStyleControl({
  styleUrl,
  onStyleChange,
  projection,
  onProjectionChange,
  terrain,
  onTerrainChange,
  buildings,
  onBuildingsChange,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const groups = MAPBOX_STYLES.reduce<Record<string, MapStyleOption[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  const matchedOption = MAPBOX_STYLES.find((s) => s.url === styleUrl);
  const label = matchedOption?.label ?? "Custom style";

  const applyCustom = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    onStyleChange(trimmed);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-deepNavy shadow-card transition hover:border-primaryBlue/40 hover:bg-surface-blue/40",
          open && "border-primaryBlue/40 bg-surface-blue/60",
        )}
      >
        <Layers className="h-4 w-4 text-primaryBlue" />
        <span className="text-ink-muted">Style:</span>
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute right-0 z-[1100] mt-2 w-[360px] overflow-hidden rounded-xl border border-border bg-surface shadow-elevated animate-fadeIn">
          <div className="max-h-[440px] overflow-y-auto scrollbar-clean">
            {Object.entries(groups).map(([category, items]) => (
              <div key={category} className="border-b border-border last:border-b-0">
                <div className="px-3 pt-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  {category}
                </div>
                <ul role="listbox" className="pb-1">
                  {items.map((opt) => {
                    const active = opt.url === styleUrl;
                    return (
                      <li key={opt.id}>
                        <button
                          onClick={() => {
                            onStyleChange(opt.url);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition hover:bg-surface-blue/60",
                            active && "bg-surface-blue/40 text-primaryBlue",
                          )}
                        >
                          <MapIcon
                            className={cn(
                              "h-4 w-4 flex-none",
                              active ? "text-primaryBlue" : "text-ink-muted",
                            )}
                          />
                          <span className="flex-1 truncate text-deepNavy">{opt.label}</span>
                          {active ? (
                            <Check className="h-4 w-4 flex-none text-primaryBlue" />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="border-t border-border bg-surface-blue/30 px-3 py-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                <Pencil className="h-3 w-3" />
                Custom style URL
              </div>
              <p className="mt-1 text-[11.5px] text-ink-muted">
                Mapbox Studio styles (<code>mapbox://styles/&lt;user&gt;/&lt;id&gt;</code>) or any
                self-hosted <code>style.json</code>.
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyCustom();
                  }}
                  placeholder="mapbox://styles/your-org/your-style"
                  className="input flex-1 text-[12px]"
                />
                <button
                  onClick={applyCustom}
                  disabled={!customUrl.trim()}
                  className="btn-primary text-[12px] py-2 px-3"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="border-t border-border bg-surface px-3 py-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Map options
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                <ToggleRow
                  icon={<Globe2 className="h-4 w-4 text-primaryBlue" />}
                  label="Globe projection"
                  description="3D globe view with atmosphere"
                  checked={projection === "globe"}
                  onChange={(on) => onProjectionChange(on ? "globe" : "mercator")}
                />
                <ToggleRow
                  icon={<Mountain className="h-4 w-4 text-greenDark" />}
                  label="Terrain & hillshade"
                  description="Elevation DEM + hillshade overlay"
                  checked={terrain}
                  onChange={onTerrainChange}
                />
                <ToggleRow
                  icon={<Box className="h-4 w-4 text-deepBlue" />}
                  label="3D buildings"
                  description="Extruded building footprints (where supported)"
                  checked={buildings}
                  onChange={onBuildingsChange}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1.5 transition hover:bg-surface-blue/40">
      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-md bg-surface-blue">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-deepNavy">{label}</span>
        <span className="block text-[11.5px] text-ink-muted">{description}</span>
      </span>
      <span className="relative ml-2 inline-flex h-5 w-9 flex-none items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-border transition peer-checked:bg-primaryBlue" />
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-surface shadow transition",
            checked && "translate-x-4",
          )}
        />
      </span>
    </label>
  );
}
