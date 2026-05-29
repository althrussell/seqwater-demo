/**
 * Cinematic Mapbox GL JS map for the SEQ Water Grid. Renders catchments,
 * pipelines, asset markers (with permanent labels for major assets), alert and
 * water-quality overlays, an optional rainfall heatmap, terrain + hillshade
 * (when satellite/outdoors style is in use) and a globe-projection fly-in on
 * first mount.
 *
 * Requires `VITE_MAPBOX_TOKEN` to be set at build time. There is no fallback —
 * if the token is missing, a small empty-state panel is shown.
 */
import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl, { type LngLatLike, type Map as MapboxMap } from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Asset, AssetRiskRow } from "@/lib/types";
import { catchmentsFeatureCollection, CATCHMENTS } from "./catchments";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
const MAPBOX_STYLE =
  (import.meta.env.VITE_MAPBOX_STYLE as string | undefined) ??
  "mapbox://styles/mapbox/satellite-streets-v12";

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const SEQ_CENTER: LngLatLike = [152.95, -27.35];
const SEQ_BOUNDS: [[number, number], [number, number]] = [
  [151.8, -28.5],
  [154.2, -26.0],
];

/** Pipelines as [lon, lat] pairs. */
const PIPELINES: [number, number][][] = [
  // Somerset -> Wivenhoe -> North Pine WTP
  [
    [152.55, -27.07],
    [152.62, -27.37],
    [152.97, -27.27],
  ],
  // Wivenhoe -> Moggill
  [
    [152.62, -27.37],
    [152.88, -27.58],
  ],
  // North Pine WTP -> Brisbane North Pump
  [
    [152.97, -27.27],
    [153.07, -27.32],
  ],
  // Brisbane North Pump -> Gold Coast Desalination Plant
  [
    [153.07, -27.32],
    [153.43, -27.95],
  ],
  // Sunshine Coast trunk
  [
    [153.05, -26.62],
    [153.05, -27.05],
    [153.07, -27.32],
  ],
];

interface MapAsset extends Pick<Asset, "asset_id" | "name" | "asset_type" | "region"> {
  lat: number;
  lon: number;
  status?: "alert" | "quality" | "normal";
}

interface AccentMarker extends MapAsset {
  variant: "alert" | "quality";
}

const ACCENTS: AccentMarker[] = [
  {
    asset_id: "ALERT-WIVENHOE",
    name: "Catchment saturation watch",
    asset_type: "Dam",
    region: "Brisbane",
    lat: -27.42,
    lon: 152.62,
    variant: "alert",
  },
  {
    asset_id: "ALERT-MOGGILL",
    name: "Turbidity watch",
    asset_type: "Water Treatment Plant",
    region: "Brisbane West",
    lat: -27.62,
    lon: 152.88,
    variant: "alert",
  },
  {
    asset_id: "QUALITY-NORTHPINE",
    name: "Quality watch — North Pine",
    asset_type: "Water Treatment Plant",
    region: "Brisbane North",
    lat: -27.27,
    lon: 152.97,
    variant: "quality",
  },
];

const DEFAULT_LABELLED = new Set([
  "Wivenhoe Dam",
  "Somerset Dam",
  "North Pine Dam",
  "North Pine WTP",
  "Mount Crosby WTP",
  "Moggill WTP",
  "Brisbane North Pump Station",
  "Gold Coast Desalination Plant",
  "Landers Shute WTP",
]);

interface SeqWaterMapProps {
  assets: MapAsset[];
  riskById?: Record<string, AssetRiskRow>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  layers: string[];
  height?: number;
  className?: string;
  labelledAssetNames?: string[];
  /** Disable user interaction; used by the Executive Overview preview. */
  preview?: boolean;
  initialZoom?: number;
  /** Override style URL. */
  styleUrl?: string;
  /** Skip the cinematic globe→SEQ fly-in. */
  disableIntro?: boolean;
}

export default function SeqWaterMap({
  assets,
  selectedId,
  onSelect,
  layers,
  height = 620,
  className,
  labelledAssetNames,
  preview = false,
  initialZoom,
  styleUrl,
  disableIntro,
}: SeqWaterMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const accentMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const styleLoadedRef = useRef(false);
  const [styleReady, setStyleReady] = useState(false);

  const labelled = useMemo(
    () => new Set(labelledAssetNames ?? Array.from(DEFAULT_LABELLED)),
    [labelledAssetNames],
  );

  const showCatchments = layers.includes("catchment") || layers.includes("rainfall");
  const showRainfall = layers.includes("rainfall");
  const showAssets = layers.includes("assets");
  const showQuality = layers.includes("quality");
  const showRisk = layers.includes("risk");

  // ---- Mount: create map + cinematic intro ----
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    const styleId = styleUrl ?? MAPBOX_STYLE;
    const wantsIntro = !preview && !disableIntro;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleId,
      center: SEQ_CENTER,
      zoom: initialZoom ?? (preview ? 7.4 : 8.4),
      pitch: wantsIntro ? 35 : 0,
      bearing: 0,
      attributionControl: !preview,
      interactive: !preview,
      maxBounds: preview ? undefined : undefined,
      projection: wantsIntro ? "globe" : "mercator",
      antialias: true,
    });
    mapRef.current = map;

    if (!preview) {
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new mapboxgl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    }
    map.dragRotate.disable();

    map.on("style.load", () => {
      styleLoadedRef.current = true;
      setStyleReady(false);

      // Atmosphere / fog for the globe.
      if (wantsIntro) {
        map.setFog({
          color: "rgb(220, 232, 245)",
          "high-color": "rgb(36, 92, 145)",
          "horizon-blend": 0.06,
          "space-color": "rgb(11, 24, 44)",
          "star-intensity": 0.15,
        });
      } else {
        try {
          map.setFog({});
        } catch {
          /* fog not required */
        }
      }

      // Terrain + hillshade if the style supports raster-dem.
      try {
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.25 });

        if (!map.getLayer("seq-hillshade")) {
          map.addLayer({
            id: "seq-hillshade",
            type: "hillshade",
            source: "mapbox-dem",
            layout: { visibility: "visible" },
            paint: {
              "hillshade-shadow-color": "#1d3a5a",
              "hillshade-highlight-color": "#fafdff",
              "hillshade-accent-color": "#3a6a8f",
              "hillshade-exaggeration": 0.55,
            },
          });
        }
      } catch (err) {
        // Some styles don't accept terrain; ignore gracefully.
        console.warn("Mapbox terrain not available for current style", err);
      }

      // 3D building footprints — only meaningful on streets-style basemaps.
      try {
        const layerExists = (id: string) => Boolean(map.getLayer(id));
        if (!layerExists("3d-buildings")) {
          const labelLayer = map
            .getStyle()
            .layers?.find((l) => l.type === "symbol" && (l.layout as any)?.["text-field"]);
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 13,
              paint: {
                "fill-extrusion-color": "#cfd8e3",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  13,
                  0,
                  15,
                  ["get", "height"],
                ],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.55,
              },
            },
            labelLayer?.id,
          );
        }
      } catch {
        // No 'composite' source / building layer — fine on satellite-only styles.
      }

      // Catchment + pipeline sources.
      if (!map.getSource("catchments")) {
        map.addSource("catchments", {
          type: "geojson",
          data: catchmentsFeatureCollection(),
        });
        map.addLayer({
          id: "catchments-fill",
          type: "fill",
          source: "catchments",
          paint: {
            "fill-color": ["get", "fill"],
            "fill-opacity": 0.18,
          },
          layout: { visibility: "visible" },
        });
        map.addLayer({
          id: "catchments-fill-rainfall",
          type: "fill",
          source: "catchments",
          paint: {
            "fill-color": ["get", "rainfallColor"],
            "fill-opacity": 0.45,
          },
          layout: { visibility: "none" },
        });
        map.addLayer({
          id: "catchments-outline",
          type: "line",
          source: "catchments",
          paint: {
            "line-color": "#5FA777",
            "line-width": 1.4,
            "line-opacity": 0.7,
          },
          layout: { visibility: "visible" },
        });
        map.addLayer({
          id: "catchments-label",
          type: "symbol",
          source: "catchments",
          minzoom: 7,
          layout: {
            "text-field": ["get", "name"],
            "text-size": 11,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-letter-spacing": 0.06,
            "text-transform": "uppercase",
          },
          paint: {
            "text-color": "#dff2ff",
            "text-halo-color": "rgba(10, 46, 77, 0.7)",
            "text-halo-width": 1.4,
          },
        });
      }

      if (!map.getSource("pipelines")) {
        map.addSource("pipelines", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: PIPELINES.map((line, i) => ({
              type: "Feature",
              id: i,
              properties: {},
              geometry: { type: "LineString", coordinates: line },
            })),
          },
        });
        map.addLayer({
          id: "pipelines-casing",
          type: "line",
          source: "pipelines",
          paint: {
            "line-color": "rgba(10, 46, 77, 0.55)",
            "line-width": 4,
            "line-opacity": 0.6,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        map.addLayer({
          id: "pipelines-line",
          type: "line",
          source: "pipelines",
          paint: {
            "line-color": "#00AEEF",
            "line-width": 2,
            "line-dasharray": [2, 1.5],
          },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      }

      // Rainfall heatmap (uses catchment centroids weighted by rainfall mm).
      if (!map.getSource("rainfall-points")) {
        map.addSource("rainfall-points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: CATCHMENTS.map((c) => {
              const lngs = c.ring.map((p) => p[0]);
              const lats = c.ring.map((p) => p[1]);
              const cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
              const cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
              return {
                type: "Feature",
                properties: { weight: c.rainfallMm / 150 },
                geometry: { type: "Point", coordinates: [cLng, cLat] },
              };
            }),
          },
        });
        map.addLayer({
          id: "rainfall-heat",
          type: "heatmap",
          source: "rainfall-points",
          maxzoom: 11,
          layout: { visibility: "none" },
          paint: {
            "heatmap-weight": ["get", "weight"],
            "heatmap-intensity": 0.9,
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              30,
              9,
              80,
              11,
              160,
            ],
            "heatmap-opacity": 0.6,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(255,255,255,0)",
              0.2,
              "rgba(216,240,251,0.6)",
              0.4,
              "rgba(134,207,229,0.7)",
              0.6,
              "rgba(95,167,119,0.8)",
              0.8,
              "rgba(216,138,0,0.85)",
              1,
              "rgba(194,65,12,0.9)",
            ],
          },
        });
      }

      setStyleReady(true);
    });

    // Globe → SEQ fly-in for the cinematic intro.
    let disposed = false;
    let mercatorTimer: ReturnType<typeof setTimeout> | null = null;
    if (wantsIntro) {
      map.once("idle", () => {
        if (disposed) return;
        map.flyTo({
          center: SEQ_CENTER,
          zoom: initialZoom ?? 8.4,
          pitch: 48,
          bearing: -8,
          speed: 0.6,
          curve: 1.5,
          essential: true,
        });
        // Drop back to mercator once we're in close — keeps performance smooth.
        mercatorTimer = setTimeout(() => {
          if (disposed) return;
          try {
            map.setProjection("mercator");
          } catch {
            /* projection switch best-effort */
          }
        }, 4200);
      });
    }

    return () => {
      disposed = true;
      if (mercatorTimer) clearTimeout(mercatorTimer);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      accentMarkersRef.current.forEach((m) => m.remove());
      accentMarkersRef.current = [];
      labelMarkersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Layer visibility ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const setVis = (id: string, on: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
      }
    };
    setVis("catchments-fill", showCatchments && !showRainfall);
    setVis("catchments-fill-rainfall", showCatchments && showRainfall);
    setVis("catchments-outline", showCatchments);
    setVis("catchments-label", showCatchments);
    setVis("rainfall-heat", showRainfall);
  }, [showCatchments, showRainfall, styleReady]);

  // ---- Asset markers (HTML) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    labelMarkersRef.current.forEach((m) => m.remove());
    labelMarkersRef.current = [];

    if (!showAssets) return;

    for (const a of assets) {
      const el = buildMarkerEl(a.asset_type, "normal", a.asset_id === selectedId);
      el.title = `${a.name} · ${a.asset_type}`;
      if (onSelect) {
        el.style.cursor = "pointer";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelect(a.asset_id);
        });
      }

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        className: "seq-mapbox-popup",
      }).setHTML(
        `<div class="seq-popup">
           <div class="seq-popup__title">${escapeHtml(a.name)}</div>
           <div class="seq-popup__sub">${escapeHtml(a.asset_type)} · ${escapeHtml(a.region)}</div>
         </div>`,
      );

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([a.lon, a.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);

      if (labelled.has(a.name)) {
        const labelEl = document.createElement("div");
        labelEl.className = "seq-map-label-html";
        labelEl.textContent = a.name;
        const labelMarker = new mapboxgl.Marker({
          element: labelEl,
          anchor: "left",
          offset: [12, 0],
        })
          .setLngLat([a.lon, a.lat])
          .addTo(map);
        labelMarkersRef.current.push(labelMarker);
      }
    }
  }, [assets, selectedId, showAssets, labelled, styleReady, onSelect]);

  // ---- Accent markers (alert + quality) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    accentMarkersRef.current.forEach((m) => m.remove());
    accentMarkersRef.current = [];

    for (const acc of ACCENTS) {
      if (acc.variant === "alert" && !showRisk) continue;
      if (acc.variant === "quality" && !showQuality) continue;

      const el = buildAccentEl(acc.variant);
      el.title = acc.name;
      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
        className: "seq-mapbox-popup",
      }).setHTML(
        `<div class="seq-popup">
           <div class="seq-popup__title">${escapeHtml(acc.name)}</div>
           <div class="seq-popup__sub">Synthetic ${acc.variant === "alert" ? "watch" : "quality"} marker</div>
         </div>`,
      );
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([acc.lon, acc.lat])
        .setPopup(popup)
        .addTo(map);
      accentMarkersRef.current.push(marker);
    }
  }, [showRisk, showQuality, styleReady]);

  // ---- Fly to selected asset ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !selectedId) return;
    const sel = assets.find((a) => a.asset_id === selectedId);
    if (!sel) return;
    map.flyTo({
      center: [sel.lon, sel.lat],
      zoom: Math.max(map.getZoom(), 10),
      speed: 0.9,
      curve: 1.4,
      essential: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, styleReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-surface-blue text-center text-[13px] text-ink-secondary",
          className,
        )}
        style={{ height }}
      >
        <div className="max-w-[420px] p-6">
          <div className="text-[13px] font-semibold uppercase tracking-wider text-deepNavy">
            Mapbox token required
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
            Set <code>VITE_MAPBOX_TOKEN</code> in <code>frontend/.env.local</code> and rebuild to enable the SEQ Water Grid map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-bounds={JSON.stringify(SEQ_BOUNDS)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-deepNavy",
        className,
      )}
      style={{ height }}
    />
  );
}

// --- Marker DOM helpers --------------------------------------------------

function buildMarkerEl(
  type: MapAsset["asset_type"],
  _status: MapAsset["status"],
  selected: boolean,
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `seq-marker-mb ${selected ? "is-selected" : ""}`;
  let inner = "";
  let kindClass = "is-dam";
  if (type === "Water Treatment Plant") {
    kindClass = "is-wtp";
    inner = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="9" width="16" height="11" rx="1"/><rect x="9" y="3" width="6" height="6" rx="0.5"/></svg>`;
  } else if (type === "Pump Station") {
    kindClass = "is-pump";
    inner = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>`;
  } else if (type === "Reservoir") {
    kindClass = "is-reservoir";
    inner = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="6" width="14" height="12" rx="1.5"/></svg>`;
  } else {
    inner = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 C 8 9 5 13 5 16 a 7 7 0 0 0 14 0 c 0 -3 -3 -7 -7 -14 z"/></svg>`;
  }
  el.classList.add(kindClass);
  el.innerHTML = `<span class="seq-marker-mb__chip">${inner}</span>`;
  return el;
}

function buildAccentEl(variant: "alert" | "quality"): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `seq-marker-mb seq-marker-mb--accent is-${variant}`;
  if (variant === "alert") {
    el.innerHTML = `<span class="seq-marker-mb__chip"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L22 20 L2 20 Z" fill="#D88A00"/></svg></span>`;
  } else {
    el.innerHTML = `<span class="seq-marker-mb__chip"><svg viewBox="0 0 24 24" fill="#7C3AED" stroke="white" stroke-width="1.5"><path d="M12 2 C 8 9 5 13 5 16 a 7 7 0 0 0 14 0 c 0 -3 -3 -7 -7 -14 z"/></svg></span>`;
  }
  return el;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
