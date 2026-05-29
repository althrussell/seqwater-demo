import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip as LTooltip,
  Popup,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AssetRiskRow } from "@/lib/types";

interface AssetMapProps {
  assets: AssetRiskRow[];
  selectedId?: string | null;
  onSelect?: (asset: AssetRiskRow) => void;
  height?: number;
  className?: string;
}

const SEQ_CENTER: LatLngExpression = [-27.55, 152.95];

const COLOURS: Record<string, string> = {
  Critical: "#FF6E5A",
  High: "#FFC04D",
  Medium: "#3FA1F2",
  Low: "#92CD6F",
};

function bandColour(band: string): string {
  return COLOURS[band] ?? "#A8A29E";
}

function FlyTo({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) {
      map.flyTo([lat, lon], 10, { duration: 0.6 });
    }
  }, [lat, lon, map]);
  return null;
}

export default function AssetMap({
  assets,
  selectedId,
  onSelect,
  height = 520,
  className,
}: AssetMapProps) {
  const valid = assets.filter((a) => a.lat != null && a.lon != null);
  const selected = valid.find((a) => a.asset_id === selectedId);

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border border-white/5", className)}
      style={{ height }}
    >
      <MapContainer
        center={SEQ_CENTER}
        zoom={8}
        scrollWheelZoom
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
        />
        {valid.map((a) => {
          const colour = bandColour(a.risk_band);
          const isSelected = a.asset_id === selectedId;
          const radius = 6 + a.risk_score * 18;
          return (
            <CircleMarker
              key={a.asset_id}
              center={[a.lat as number, a.lon as number]}
              radius={radius}
              pathOptions={{
                color: colour,
                weight: isSelected ? 3 : 1.5,
                opacity: 0.95,
                fillColor: colour,
                fillOpacity: isSelected ? 0.85 : 0.55,
              }}
              eventHandlers={{
                click: () => onSelect?.(a),
              }}
            >
              <LTooltip direction="top" offset={[0, -6]} opacity={1}>
                <div className="space-y-0.5">
                  <div className="font-semibold">{a.asset_name}</div>
                  <div className="text-[11px] opacity-80">
                    {a.asset_type} · {a.risk_band}
                  </div>
                </div>
              </LTooltip>
              <Popup>
                <div className="text-xs">
                  <div className="text-[11px] uppercase tracking-wider text-water-300">
                    Synthetic asset
                  </div>
                  <div className="mt-1 text-sm font-semibold text-ink-50">
                    {a.asset_name}
                  </div>
                  <div className="text-[11px] text-ink-300">
                    {a.asset_type}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Stat label="Band" value={a.risk_band} />
                    <Stat label="Score" value={a.risk_score.toFixed(2)} />
                    <Stat
                      label="30d failure"
                      value={`${(a.predicted_failure_30d * 100).toFixed(0)}%`}
                    />
                    <Stat label="Open WO" value={String(a.open_work_orders)} />
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {selected ? <FlyTo lat={selected.lat} lon={selected.lon} /> : null}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/60 px-2.5 py-1.5 text-[10px] text-ink-200 backdrop-blur">
        <span className="uppercase tracking-wider text-ink-300">Risk band</span>
        {Object.entries(COLOURS).map(([band, colour]) => (
          <span key={band} className="ml-1 inline-flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: colour }}
            />
            {band}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/[0.05] px-2 py-1">
      <div className="text-[10px] uppercase tracking-wider text-ink-300">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-50">{value}</div>
    </div>
  );
}
