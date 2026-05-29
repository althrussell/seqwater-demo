import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import AssetMap from "@/components/AssetMap";
import AssetDrawer from "@/components/AssetDrawer";
import Section from "@/components/Section";
import RiskBadge from "@/components/RiskBadge";
import { Filter, Layers } from "lucide-react";

const ASSET_TYPES = [
  "All",
  "Dam",
  "Water Treatment Plant",
  "Pump Station",
  "Catchment Monitoring Site",
  "Recreation Site",
  "Desalination Plant",
  "Recycled Water Plant",
];

const RISK_BANDS = ["All", "Critical", "High", "Medium", "Low"];

const LAYERS = [
  { id: "rainfall", label: "Rainfall forecast", description: "Synthetic 72h mean" },
  { id: "saturation", label: "Catchment saturation", description: "Synthetic index" },
  { id: "criticality", label: "Asset criticality", description: "Synthetic UC field" },
  { id: "quality", label: "Water quality alerts", description: "Synthetic samples" },
  { id: "capital", label: "Capital projects", description: "Synthetic projects" },
];

export default function WaterSecurityMap() {
  const risk = useQuery({ queryKey: ["asset-risk"], queryFn: api.assetRisk });
  const security = useQuery({ queryKey: ["water-security"], queryFn: api.waterSecurity });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [type, setType] = useState("All");
  const [band, setBand] = useState("All");
  const [activeLayers, setActiveLayers] = useState<string[]>(["rainfall", "criticality"]);

  const assets = useMemo(() => {
    return (risk.data ?? []).filter((a) => {
      if (type !== "All" && a.asset_type !== type) return false;
      if (band !== "All" && a.risk_band !== band) return false;
      return true;
    });
  }, [risk.data, type, band]);

  const summary = security.data as any;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SmallStat
          label="Synthetic SEQ storage"
          value={`${(summary?.storage_percent ?? 0).toFixed(1)}%`}
          sublabel="Aggregate across synthetic dams"
        />
        <SmallStat
          label="Synthetic 72h rainfall (mean)"
          value={`${(summary?.forecast_rainfall_mm_72h_avg ?? 0).toFixed(0)} mm`}
          sublabel="Across catchment monitoring sites"
        />
        <SmallStat
          label="Synthetic grid transfers"
          value={String(summary?.transfers?.length ?? 0)}
          sublabel="Recommended this synthetic snapshot"
        />
      </div>

      <Section
        title="Synthetic SEQ Water Grid map"
        description="Real Seqwater asset locations from seqwater.com.au. All values shown are synthetic for demo purposes."
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-ink-300" />
            <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select className="input w-auto" value={band} onChange={(e) => setBand(e.target.value)}>
              {RISK_BANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1fr,300px]">
          <div className="relative">
            <AssetMap
              assets={assets}
              selectedId={selectedId}
              onSelect={(a) => setSelectedId(a.asset_id)}
              height={560}
            />
          </div>

          <aside className="space-y-3">
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-ink-300" />
                <span className="text-[10px] uppercase tracking-wider text-ink-300">
                  Synthetic map layers
                </span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {LAYERS.map((l) => {
                  const active = activeLayers.includes(l.id);
                  return (
                    <li key={l.id}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 transition hover:border-white/15">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-brand-500"
                          checked={active}
                          onChange={() =>
                            setActiveLayers((arr) =>
                              active ? arr.filter((x) => x !== l.id) : [...arr, l.id],
                            )
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium text-ink-50">{l.label}</div>
                          <div className="text-[11px] text-ink-300">{l.description}</div>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-300">
                Layer toggles are visual scaffolding for the demo. Each layer has a
                synthetic table or view in `main.seqwater_demo.*` ready for live wiring.
              </p>
            </div>

            <div className="panel p-4">
              <span className="text-[10px] uppercase tracking-wider text-ink-300">
                Top synthetic risks on map
              </span>
              <ul className="mt-2 space-y-1.5 text-xs">
                {assets.slice(0, 6).map((a) => (
                  <li key={a.asset_id}>
                    <button
                      onClick={() => setSelectedId(a.asset_id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left transition hover:border-brand-400/30 hover:bg-brand-500/[0.05]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm text-ink-50">{a.asset_name}</div>
                        <div className="truncate text-[11px] text-ink-300">
                          {a.asset_type}
                        </div>
                      </div>
                      <RiskBadge band={a.risk_band} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>

      {selectedId ? (
        <AssetDrawer assetId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function SmallStat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="panel p-4">
      <div className="text-[10px] uppercase tracking-wider text-ink-300">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink-50">{value}</div>
      <div className="mt-1 text-[11px] text-ink-300">{sublabel}</div>
    </div>
  );
}
