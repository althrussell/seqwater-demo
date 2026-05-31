/**
 * Flood-specific catchment impact map.
 *
 * Renders the five catchments named in `CATCHMENT_IMPACTS` (Lockyer Valley,
 * Bremer River, Brisbane River, Logan River, Gold Coast Creeks) over a clean
 * light basemap, coloured by their impact level for the active flood scenario.
 *
 * The polygons are illustrative approximations of SEQ catchment geography —
 * tuned for narrative clarity on the Flood Readiness scenario panel, not
 * geographically authoritative. They intentionally live next to this component
 * (rather than in `catchments.ts`) because they map 1:1 to the impact table
 * shown on the same page.
 *
 * Requires `VITE_MAPBOX_TOKEN`. The parent should render the SVG fallback
 * (`SyntheticCatchmentMap`) when no token is configured.
 */
import "mapbox-gl/dist/mapbox-gl.css";

import mapboxgl, { type LngLatLike, type Map as MapboxMap } from "mapbox-gl";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export const FLOOD_MAPBOX_AVAILABLE = Boolean(MAPBOX_TOKEN);

const SEQ_CENTER: LngLatLike = [152.85, -27.55];

const IMPACT_FILL: Record<string, string> = {
  low: "#5FA777",
  medium: "#0076BE",
  high: "#D88A00",
};

interface CatchmentPoly {
  name: string;
  /** Approximate centre for the on-map label, [lon, lat]. */
  labelAt: [number, number];
  /** Outer ring as GeoJSON [lon, lat] tuples; closed automatically. */
  ring: [number, number][];
}

const FLOOD_CATCHMENT_POLYS: CatchmentPoly[] = [
  {
    name: "Lockyer Valley",
    labelAt: [152.2, -27.45],
    ring: [
      [151.95, -27.2],
      [152.2, -27.15],
      [152.45, -27.3],
      [152.45, -27.65],
      [152.2, -27.7],
      [151.95, -27.6],
    ],
  },
  {
    name: "Brisbane River",
    labelAt: [152.85, -27.1],
    ring: [
      [152.45, -26.65],
      [152.85, -26.55],
      [153.15, -26.85],
      [153.15, -27.4],
      [152.95, -27.5],
      [152.65, -27.4],
      [152.45, -27.3],
      [152.45, -26.85],
    ],
  },
  {
    name: "Bremer River",
    labelAt: [152.7, -27.78],
    ring: [
      [152.45, -27.65],
      [152.75, -27.6],
      [152.95, -27.7],
      [152.95, -27.9],
      [152.65, -27.9],
      [152.45, -27.85],
    ],
  },
  {
    name: "Logan River",
    labelAt: [152.95, -28.05],
    ring: [
      [152.55, -27.9],
      [152.95, -27.9],
      [153.2, -27.95],
      [153.3, -28.05],
      [153.2, -28.2],
      [152.95, -28.2],
      [152.65, -28.15],
    ],
  },
  {
    name: "Gold Coast Creeks",
    labelAt: [153.35, -28.1],
    ring: [
      [153.2, -27.95],
      [153.45, -27.95],
      [153.5, -28.2],
      [153.45, -28.3],
      [153.25, -28.3],
      [153.2, -28.2],
    ],
  },
];

export interface FloodCatchmentImpact {
  catchment: string;
  impact: "low" | "medium" | "high";
  peakLevel: string;
  confidence: string;
}

interface Props {
  impacts: FloodCatchmentImpact[];
  className?: string;
}

function toFeatureCollection(
  impacts: FloodCatchmentImpact[],
): GeoJSON.FeatureCollection {
  const impactByName = new Map(impacts.map((i) => [i.catchment, i]));
  return {
    type: "FeatureCollection",
    features: FLOOD_CATCHMENT_POLYS.map((p) => {
      const impact = impactByName.get(p.name);
      const level = impact?.impact ?? "low";
      return {
        type: "Feature",
        properties: {
          name: p.name,
          impact: level,
          fill: IMPACT_FILL[level],
          peakLevel: impact?.peakLevel ?? "—",
          confidence: impact?.confidence ?? "—",
        },
        geometry: {
          type: "Polygon",
          coordinates: [[...p.ring, p.ring[0]]],
        },
      };
    }),
  };
}

export default function FloodCatchmentImpactMap({ impacts, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const labelMarkersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: SEQ_CENTER,
      zoom: 7.5,
      interactive: true,
      attributionControl: false,
      projection: "mercator",
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const addPolygons = () => {
      const data = toFeatureCollection(impacts);
      if (map.getSource("flood-catchments")) {
        (map.getSource("flood-catchments") as mapboxgl.GeoJSONSource).setData(data);
      } else {
        map.addSource("flood-catchments", { type: "geojson", data });
        map.addLayer({
          id: "flood-catchments-fill",
          type: "fill",
          source: "flood-catchments",
          paint: {
            "fill-color": ["get", "fill"],
            "fill-opacity": 0.45,
          },
        });
        map.addLayer({
          id: "flood-catchments-outline",
          type: "line",
          source: "flood-catchments",
          paint: {
            "line-color": ["get", "fill"],
            "line-width": 1.5,
            "line-opacity": 0.85,
          },
        });
      }

      labelMarkersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current = FLOOD_CATCHMENT_POLYS.map((p) => {
        const el = document.createElement("div");
        el.className =
          "pointer-events-none whitespace-nowrap rounded-md bg-white/90 px-1.5 py-0.5 text-[10.5px] font-semibold text-deepNavy shadow-card backdrop-blur";
        el.textContent = p.name;
        return new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(p.labelAt)
          .addTo(map);
      });
    };

    map.on("load", addPolygons);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          try {
            mapRef.current.resize();
          } catch {
            /* mid-destruction */
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      labelMarkersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current = [];
      map.off("load", addPolygons);
      map.remove();
      mapRef.current = null;
    };
    // We intentionally mount once; impact changes are handled by the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the polygon fills in sync with the current scenario impacts.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("flood-catchments") as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData(toFeatureCollection(impacts));
    }
  }, [impacts]);

  if (!MAPBOX_TOKEN) {
    return null;
  }

  return (
    <div className={cn("relative h-full min-h-0 w-full overflow-hidden", className)}>
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
