import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import SeqWaterMap from "@/components/map/SeqWaterMap";
import MapStyleControl from "@/components/map/MapStyleControl";
import LayerPillBar, { useLayerToggle, MAP_LAYERS } from "@/components/ui/LayerPillBar";
import MapLegend, { RainfallLegend } from "@/components/ui/MapLegend";
import AssetDrawer from "@/components/ui/AssetDrawer";
import {
  BUILDINGS_STORAGE_KEY,
  DEFAULT_STYLE_URL,
  PROJECTION_STORAGE_KEY,
  STYLE_STORAGE_KEY,
  TERRAIN_STORAGE_KEY,
  loadBool,
  loadString,
  persist,
  type ProjectionId,
} from "@/components/map/mapStyles";

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

  const [styleUrl, setStyleUrl] = useState<string>(() =>
    loadString(STYLE_STORAGE_KEY, DEFAULT_STYLE_URL),
  );
  const [projection, setProjection] = useState<ProjectionId>(() =>
    (loadString(PROJECTION_STORAGE_KEY, "mercator") as ProjectionId) ?? "mercator",
  );
  const [terrain, setTerrain] = useState<boolean>(() => loadBool(TERRAIN_STORAGE_KEY, true));
  const [buildings, setBuildings] = useState<boolean>(() =>
    loadBool(BUILDINGS_STORAGE_KEY, true),
  );

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
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <LayerPillBar
            active={active}
            onToggle={(id) => onToggle(id)}
            layers={MAP_LAYERS}
            onOptions={() => {
              /* layer options placeholder */
            }}
          />
        </div>
        <MapStyleControl
          styleUrl={styleUrl}
          onStyleChange={(url) => {
            setStyleUrl(url);
            persist(STYLE_STORAGE_KEY, url);
          }}
          projection={projection}
          onProjectionChange={(p) => {
            setProjection(p);
            persist(PROJECTION_STORAGE_KEY, p);
          }}
          terrain={terrain}
          onTerrainChange={(v) => {
            setTerrain(v);
            persist(TERRAIN_STORAGE_KEY, v);
          }}
          buildings={buildings}
          onBuildingsChange={(v) => {
            setBuildings(v);
            persist(BUILDINGS_STORAGE_KEY, v);
          }}
        />
      </div>

      {/*
        Map row fills the remaining viewport height. The app shell chrome
        (header + footer disclaimer + page padding + layer pill row) costs
        ~210px on a typical 1280×800 laptop demo; min-h keeps things sane on
        short screens.
      */}
      <div className="flex h-[calc(100vh-210px)] min-h-[520px] items-stretch gap-3">
        <div className="relative min-w-0 flex-1">
          <SeqWaterMap
            assets={mapAssets}
            riskById={riskById}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            layers={active}
            height="100%"
            styleUrl={styleUrl}
            projection={projection}
            terrain={terrain}
            buildings={buildings}
          />

          <div className="pointer-events-none absolute bottom-4 left-4 z-[400] hidden flex-col gap-3 md:flex">
            <MapLegend className="pointer-events-auto w-[200px]" />
            {active.includes("rainfall") ? (
              <RainfallLegend className="pointer-events-auto w-[260px]" />
            ) : null}
          </div>
        </div>

        {/*
          Drawer column animates its own width so the map next to it shrinks
          smoothly. The inner wrapper keeps a fixed 440px so the drawer
          content doesn't reflow during the transition. The map's
          ResizeObserver picks up the width change and calls map.resize().
        */}
        <div
          className={cn(
            "h-full flex-none overflow-hidden transition-[width] duration-300 ease-out",
            selectedId ? "w-[440px]" : "w-0",
          )}
        >
          <div className="h-full w-[440px]">
            <AssetDrawer
              assetId={selectedId}
              onClose={() => setSelectedId(null)}
              variant="inline"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
