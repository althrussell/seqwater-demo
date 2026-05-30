/**
 * Cinematic Mapbox GL JS map for the SEQ Water Grid.
 *
 * Renders catchments, pipelines, asset markers (with permanent labels for
 * major assets), alert and water-quality overlays, an optional rainfall
 * heatmap, terrain + hillshade, 3D buildings, and a globe-projection fly-in
 * on first mount.
 *
 * Requires `VITE_MAPBOX_TOKEN` to be set at build time. There is no fallback —
 * if the token is missing, a small empty-state panel is shown.
 *
 * The basemap style, projection, terrain, and 3D-buildings settings can all
 * be swapped at runtime via the props below. When the style URL changes we
 * rebuild every custom source/layer on the new style's `style.load` event.
 */
import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl, { type LngLatLike, type Map as MapboxMap } from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Asset, AssetRiskRow } from "@/lib/types";
import { catchmentsFeatureCollection, CATCHMENTS } from "./catchments";
import { DEFAULT_STYLE_URL, type ProjectionId } from "./mapStyles";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const SEQ_CENTER: LngLatLike = [152.95, -27.35];

/** Pipelines as [lon, lat] pairs. */
const PIPELINES: [number, number][][] = [
  [
    [152.55, -27.07],
    [152.62, -27.37],
    [152.97, -27.27],
  ],
  [
    [152.62, -27.37],
    [152.88, -27.58],
  ],
  [
    [152.97, -27.27],
    [153.07, -27.32],
  ],
  [
    [153.07, -27.32],
    [153.43, -27.95],
  ],
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
  /**
   * Map height. Number is interpreted as pixels; string is passed straight
   * through (use "100%" or a `calc(...)` to make the map fill a parent that
   * has its own height).
   */
  height?: number | string;
  className?: string;
  labelledAssetNames?: string[];
  preview?: boolean;
  initialZoom?: number;
  /** Mapbox style URL. Defaults to `VITE_MAPBOX_STYLE` or satellite-streets. */
  styleUrl?: string;
  /** `mercator` or `globe`. Defaults to globe for the cinematic intro, mercator afterwards. */
  projection?: ProjectionId;
  /** Show terrain DEM + hillshade. Defaults to true. */
  terrain?: boolean;
  /** Show 3D building extrusions. Defaults to true; quietly skipped on styles without a building layer. */
  buildings?: boolean;
  disableIntro?: boolean;
  /**
   * When true, render compact marker chips (smaller, thinner ring). Used by
   * the Executive Overview preview so the map reads as a curated geospatial
   * panel rather than a heavy operational map. Defaults to `preview`.
   */
  compactMarkers?: boolean;
  /**
   * When true (and `preview` is true), suppresses the basemap's road and
   * label clutter so the SEQ Water Grid layer reads as a custom product
   * surface. Defaults to true.
   */
  cleanBasemap?: boolean;
  /** Optional layer label rendered as a small badge in the top-left of the map. */
  layerLabel?: string;
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
  projection,
  terrain = true,
  buildings = true,
  disableIntro,
  compactMarkers,
  cleanBasemap = true,
  layerLabel,
}: SeqWaterMapProps) {
  const useCompact = compactMarkers ?? preview;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const accentMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);
  // Records the style URL the constructor used; lets the styleUrl effect skip
  // its first invocation (which would otherwise hit Mapbox before the initial
  // style has finished loading and throw "Style is not done loading").
  const initialStyleRef = useRef<string | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);

  const labelled = useMemo(
    () => new Set(labelledAssetNames ?? Array.from(DEFAULT_LABELLED)),
    [labelledAssetNames],
  );

  const showCatchments = layers.includes("catchment") || layers.includes("rainfall");
  const showRainfall = layers.includes("rainfall");
  const showAssets = layers.includes("assets");
  const showQuality = layers.includes("quality");
  const showRisk = layers.includes("risk");

  // ---- Mount the map once ----
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    const startStyle = styleUrl ?? DEFAULT_STYLE_URL;
    initialStyleRef.current = startStyle;
    const wantsIntro = !preview && !disableIntro;
    const startProjection: ProjectionId = preview
      ? "mercator"
      : projection ?? (wantsIntro ? "globe" : "mercator");

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: startStyle,
      center: SEQ_CENTER,
      zoom: initialZoom ?? (preview ? 7.4 : 8.4),
      pitch: wantsIntro ? 35 : 0,
      bearing: 0,
      attributionControl: !preview,
      interactive: !preview,
      projection: startProjection,
      antialias: true,
    });
    mapRef.current = map;

    if (!preview) {
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new mapboxgl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    }

    // Re-bind custom sources/layers every time the style is (re)loaded.
    const onStyleLoad = () => {
      addCustomLayers(map, { terrain, buildings, wantsIntro });
      if (preview && cleanBasemap) {
        suppressBasemapClutter(map);
      }
      setStyleReady(true);
      // Bumping the version causes the marker/layer effects to re-run so HTML
      // markers re-bind cleanly after a style swap.
      setStyleVersion((v) => v + 1);
    };
    map.on("style.load", onStyleLoad);

    // Globe → SEQ fly-in only on the first mount.
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

    // Mapbox doesn't auto-detect parent layout changes. Watch the container
    // and trigger map.resize() so the canvas tracks any width/height changes
    // (e.g. when the asset drawer opens and the map column shrinks).
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          try {
            mapRef.current.resize();
          } catch {
            /* map may be mid-destruction */
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      if (mercatorTimer) clearTimeout(mercatorTimer);
      resizeObserver?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      accentMarkersRef.current.forEach((m) => m.remove());
      accentMarkersRef.current = [];
      labelMarkersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current = [];
      map.off("style.load", onStyleLoad);
      map.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
    // We intentionally mount once and react to prop changes in other effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- React to styleUrl changes ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleUrl) return;
    // Skip the very first invocation: the map constructor already loaded this
    // URL and calling setStyle (or even getStyle) before the initial style is
    // loaded throws "Style is not done loading".
    if (initialStyleRef.current === null || initialStyleRef.current === styleUrl) {
      initialStyleRef.current = styleUrl;
      return;
    }
    setStyleReady(false);
    try {
      map.setStyle(styleUrl);
      initialStyleRef.current = styleUrl;
    } catch (err) {
      console.warn("Failed to apply Mapbox style", styleUrl, err);
    }
  }, [styleUrl]);

  // ---- React to projection changes ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !projection || !styleReady) return;
    try {
      map.setProjection(projection);
    } catch {
      /* not supported on every style — ignore */
    }
  }, [projection, styleReady]);

  // ---- React to terrain / buildings toggles ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    try {
      if (map.getSource("mapbox-dem")) {
        map.setTerrain(terrain ? { source: "mapbox-dem", exaggeration: 1.25 } : null);
      }
      if (map.getLayer("seq-hillshade")) {
        map.setLayoutProperty("seq-hillshade", "visibility", terrain ? "visible" : "none");
      }
      if (map.getLayer("3d-buildings")) {
        map.setLayoutProperty("3d-buildings", "visibility", buildings ? "visible" : "none");
      }
    } catch {
      /* not all styles support these knobs */
    }
  }, [terrain, buildings, styleReady]);

  // ---- React to layer toggles ----
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
  }, [showCatchments, showRainfall, styleReady, styleVersion]);

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
      const el = buildMarkerEl(a.asset_type, "normal", a.asset_id === selectedId, useCompact);
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
  }, [assets, selectedId, showAssets, labelled, styleReady, styleVersion, onSelect]);

  // ---- Accent markers (alert + quality) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    accentMarkersRef.current.forEach((m) => m.remove());
    accentMarkersRef.current = [];

    for (const acc of ACCENTS) {
      if (acc.variant === "alert" && !showRisk) continue;
      if (acc.variant === "quality" && !showQuality) continue;

      const el = buildAccentEl(acc.variant, useCompact);
      el.title = acc.name;
      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
        className: "seq-mapbox-popup",
      }).setHTML(
        `<div class="seq-popup">
           <div class="seq-popup__title">${escapeHtml(acc.name)}</div>
           <div class="seq-popup__sub">${acc.variant === "alert" ? "watch" : "quality"} marker</div>
         </div>`,
      );
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([acc.lon, acc.lat])
        .setPopup(popup)
        .addTo(map);
      accentMarkersRef.current.push(marker);
    }
  }, [showRisk, showQuality, styleReady, styleVersion]);

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
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-deepNavy",
        className,
      )}
      style={{ height }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {layerLabel ? (
        <div className="pointer-events-none absolute left-3 top-3 z-[400] inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-deepNavy shadow-card backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primaryBlue" />
          {layerLabel}
        </div>
      ) : null}
    </div>
  );
}

// ---- Custom layer plumbing ---------------------------------------------

interface AddLayersOpts {
  terrain: boolean;
  buildings: boolean;
  wantsIntro: boolean;
}

function addCustomLayers(map: MapboxMap, opts: AddLayersOpts): void {
  // Atmosphere / fog (only meaningful when projection is globe).
  try {
    if (opts.wantsIntro) {
      map.setFog({
        color: "rgb(220, 232, 245)",
        "high-color": "rgb(36, 92, 145)",
        "horizon-blend": 0.06,
        "space-color": "rgb(11, 24, 44)",
        "star-intensity": 0.15,
      });
    } else {
      map.setFog({});
    }
  } catch {
    /* fog optional */
  }

  // Terrain + hillshade.
  try {
    if (!map.getSource("mapbox-dem")) {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }
    if (opts.terrain) {
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.25 });
    } else {
      map.setTerrain(null);
    }
    if (!map.getLayer("seq-hillshade")) {
      map.addLayer({
        id: "seq-hillshade",
        type: "hillshade",
        source: "mapbox-dem",
        layout: { visibility: opts.terrain ? "visible" : "none" },
        paint: {
          "hillshade-shadow-color": "#1d3a5a",
          "hillshade-highlight-color": "#fafdff",
          "hillshade-accent-color": "#3a6a8f",
          "hillshade-exaggeration": 0.55,
        },
      });
    }
  } catch (err) {
    console.warn("Terrain unavailable for current style", err);
  }

  // 3D building extrusions where supported.
  try {
    if (!map.getLayer("3d-buildings")) {
      const labelLayer = map
        .getStyle()
        .layers?.find((l) => l.type === "symbol" && (l.layout as any)?.["text-field"]);
      const styleSources = map.getStyle().sources ?? {};
      const hasComposite =
        Object.prototype.hasOwnProperty.call(styleSources, "composite") &&
        // The standard style uses "composite" but exposes no "building" source-layer.
        // We have to attempt and let mapbox throw if it isn't there.
        true;
      if (hasComposite) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 13,
            layout: { visibility: opts.buildings ? "visible" : "none" },
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
    }
  } catch {
    /* style has no buildings source-layer */
  }

  // Catchments.
  if (!map.getSource("catchments")) {
    map.addSource("catchments", {
      type: "geojson",
      data: catchmentsFeatureCollection(),
    });
  }
  if (!map.getLayer("catchments-fill")) {
    map.addLayer({
      id: "catchments-fill",
      type: "fill",
      source: "catchments",
      paint: {
        // Soft, transparent enterprise green (consistent across all catchments
        // in preview) — feels like a layer rather than a coloured map.
        "fill-color": "#5FA777",
        "fill-opacity": 0.16,
      },
    });
  }
  if (!map.getLayer("catchments-fill-rainfall")) {
    map.addLayer({
      id: "catchments-fill-rainfall",
      type: "fill",
      source: "catchments",
      paint: { "fill-color": ["get", "rainfallColor"], "fill-opacity": 0.45 },
      layout: { visibility: "none" },
    });
  }
  if (!map.getLayer("catchments-outline")) {
    map.addLayer({
      id: "catchments-outline",
      type: "line",
      source: "catchments",
      paint: {
        "line-color": "#3F8C5C",
        "line-width": 1.1,
        "line-opacity": 0.55,
      },
    });
  }
  if (!map.getLayer("catchments-label")) {
    map.addLayer({
      id: "catchments-label",
      type: "symbol",
      source: "catchments",
      minzoom: 6.5,
      layout: {
        "text-field": ["get", "name"],
        "text-size": 10.5,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-letter-spacing": 0.08,
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#1F4D33",
        "text-halo-color": "rgba(255,255,255,0.92)",
        "text-halo-width": 1.6,
      },
    });
  }

  // Pipelines.
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
  }
  if (!map.getLayer("pipelines-casing")) {
    map.addLayer({
      id: "pipelines-casing",
      type: "line",
      source: "pipelines",
      paint: {
        "line-color": "rgba(255,255,255,0.85)",
        "line-width": 3.4,
        "line-opacity": 0.85,
      },
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }
  if (!map.getLayer("pipelines-line")) {
    map.addLayer({
      id: "pipelines-line",
      type: "line",
      source: "pipelines",
      paint: {
        "line-color": "#0076BE",
        "line-width": 1.6,
        "line-opacity": 0.85,
        "line-dasharray": [3, 2],
      },
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }

  // Rainfall heatmap.
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
  }
  if (!map.getLayer("rainfall-heat")) {
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
}

// ---- Marker DOM helpers ------------------------------------------------

function buildMarkerEl(
  type: MapAsset["asset_type"],
  _status: MapAsset["status"],
  selected: boolean,
  compact: boolean,
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `seq-marker-mb ${selected ? "is-selected" : ""} ${compact ? "is-compact" : ""}`;
  let inner = "";
  let kindClass = "is-dam";
  if (type === "Water Treatment Plant" || type === "Desalination Plant") {
    kindClass = "is-wtp";
    inner = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="9" width="16" height="11" rx="1"/><rect x="9" y="3" width="6" height="6" rx="0.5"/></svg>`;
  } else if (type === "Pump Station") {
    kindClass = "is-pump";
    inner = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3.6"/><path d="M12 5 L12 8 M12 16 L12 19 M5 12 L8 12 M16 12 L19 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
  } else if (type === "Reservoir") {
    kindClass = "is-reservoir";
    inner = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="6" width="14" height="12" rx="1.5"/></svg>`;
  } else {
    // Dam / catchment storage — a clean droplet that reads as "water".
    inner = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 C 9 9 6.5 12.5 6.5 15.2 a 5.5 5.5 0 0 0 11 0 C 17.5 12.5 15 9 12 3 z"/></svg>`;
  }
  el.classList.add(kindClass);
  el.innerHTML = `<span class="seq-marker-mb__chip">${inner}</span>`;
  return el;
}

function buildAccentEl(variant: "alert" | "quality", compact: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `seq-marker-mb seq-marker-mb--accent is-${variant} ${compact ? "is-compact" : ""}`;
  if (variant === "alert") {
    el.innerHTML = `<span class="seq-marker-mb__chip"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 L21 19 L3 19 Z" fill="#D88A00"/></svg></span>`;
  } else {
    el.innerHTML = `<span class="seq-marker-mb__chip"><svg viewBox="0 0 24 24" fill="#7C3AED" stroke="white" stroke-width="1.5"><path d="M12 3 C 9 9 6.5 12.5 6.5 15.2 a 5.5 5.5 0 0 0 11 0 C 17.5 12.5 15 9 12 3 z"/></svg></span>`;
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

/**
 * Hides road, place, POI and transit labels on the basemap so the SEQ Water
 * Grid layer reads as a custom enterprise map rather than a satellite or
 * navigation screenshot. Best-effort — silently skips layers that don't
 * exist in the active style.
 */
function suppressBasemapClutter(map: MapboxMap): void {
  try {
    const style = map.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
      const id = layer.id;
      if (
        id.startsWith("seq-") ||
        id.startsWith("catchments-") ||
        id.startsWith("pipelines-") ||
        id === "rainfall-heat" ||
        id === "3d-buildings"
      ) {
        continue;
      }
      // Hide just the noisy basemap content — roads, road labels, POIs,
      // transit, building footprints, and most place/admin labels. We
      // intentionally leave water polygons, water labels and country/state
      // boundaries alone so the geographic backdrop still feels like SEQ.
      const hide =
        /^(road|tunnel|bridge|motorway|trunk|primary|secondary|tertiary|street|service|path|track|cycle|pedestrian|ferry|aeroway|aerialway|transit|rail|airport|poi|building|housenum|landuse-overlay)/i.test(
          id,
        ) ||
        /(road-label|road-shield|road-number|poi-label|transit-label|airport-label|settlement-subdivision-label|settlement-minor-label|natural-point-label|natural-line-label)/i.test(
          id,
        );
      if (hide) {
        try {
          map.setLayoutProperty(id, "visibility", "none");
        } catch {
          /* layer doesn't support visibility */
        }
      }
    }
  } catch {
    /* best-effort */
  }
}
