import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import SeqWaterMap from "@/components/map/SeqWaterMap";
import LayerPillBar, { useLayerToggle, MAP_LAYERS } from "@/components/ui/LayerPillBar";
import MapLegend, { RainfallLegend } from "@/components/ui/MapLegend";
import AssetDrawer from "@/components/ui/AssetDrawer";

export default function SeqWaterGridMap() {
  const { active, onToggle } = useLayerToggle([
    "assets",
    "rainfall",
    "catchment",
    "quality",
    "risk",
  ]);
  const assets = useQuery({ queryKey: ["assets"], queryFn: api.assets });
  const risk = useQuery({ queryKey: ["asset-risk"], queryFn: api.assetRisk });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapAssets = useMemo(() => {
    const list = (assets.data ?? [])
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => ({
        asset_id: a.asset_id,
        name: a.name,
        asset_type: a.asset_type,
        region: a.region,
        lat: a.lat as number,
        lon: a.lon as number,
      }));
    return list;
  }, [assets.data]);

  const riskById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of risk.data ?? []) map[r.asset_id] = r;
    return map;
  }, [risk.data]);

  return (
    <div className="space-y-3">
      <LayerPillBar
        active={active}
        onToggle={(id) => {
          if (id === "all") {
            onToggle("all");
            return;
          }
          onToggle(id);
        }}
        layers={MAP_LAYERS}
        onOptions={() => {
          /* layer options placeholder */
        }}
      />

      <div className="relative">
        <SeqWaterMap
          assets={mapAssets}
          riskById={riskById}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          layers={active}
          height={640}
        />

        <div className="pointer-events-none absolute bottom-4 left-4 z-[400] hidden flex-col gap-3 md:flex">
          <MapLegend className="pointer-events-auto w-[200px]" />
          {active.includes("rainfall") ? (
            <RainfallLegend className="pointer-events-auto w-[260px]" />
          ) : null}
        </div>
      </div>

      <AssetDrawer assetId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
