/**
 * Catalog of Mapbox standard styles + helpers for persisting the user's choice.
 *
 * Source: https://docs.mapbox.com/api/maps/styles/#mapbox-styles
 *
 * Custom Studio styles (mapbox://styles/<user>/<id>) and self-hosted style.json
 * URLs are also supported via the "custom URL" entry in the picker.
 */

export type ProjectionId = "mercator" | "globe";

export interface MapStyleOption {
  id: string;
  label: string;
  url: string;
  /** Imagery / terrain style — globe + 3D look best here. */
  category: "Standard" | "Streets" | "Outdoors" | "Imagery" | "Light & Dark" | "Navigation";
  /** Whether this style has a `composite` source with the `building` layer for 3D extrusion. */
  supports3DBuildings?: boolean;
}

export const MAPBOX_STYLES: MapStyleOption[] = [
  {
    id: "standard",
    label: "Standard",
    url: "mapbox://styles/mapbox/standard",
    category: "Standard",
  },
  {
    id: "standard-satellite",
    label: "Standard Satellite",
    url: "mapbox://styles/mapbox/standard-satellite",
    category: "Standard",
  },
  {
    id: "streets",
    label: "Streets",
    url: "mapbox://styles/mapbox/streets-v12",
    category: "Streets",
    supports3DBuildings: true,
  },
  {
    id: "outdoors",
    label: "Outdoors",
    url: "mapbox://styles/mapbox/outdoors-v12",
    category: "Outdoors",
    supports3DBuildings: true,
  },
  {
    id: "light",
    label: "Light",
    url: "mapbox://styles/mapbox/light-v11",
    category: "Light & Dark",
    supports3DBuildings: true,
  },
  {
    id: "dark",
    label: "Dark",
    url: "mapbox://styles/mapbox/dark-v11",
    category: "Light & Dark",
    supports3DBuildings: true,
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "mapbox://styles/mapbox/satellite-v9",
    category: "Imagery",
  },
  {
    id: "satellite-streets",
    label: "Satellite Streets",
    url: "mapbox://styles/mapbox/satellite-streets-v12",
    category: "Imagery",
    supports3DBuildings: true,
  },
  {
    id: "navigation-day",
    label: "Navigation Day",
    url: "mapbox://styles/mapbox/navigation-day-v1",
    category: "Navigation",
    supports3DBuildings: true,
  },
  {
    id: "navigation-night",
    label: "Navigation Night",
    url: "mapbox://styles/mapbox/navigation-night-v1",
    category: "Navigation",
    supports3DBuildings: true,
  },
];

export const DEFAULT_STYLE_URL =
  (import.meta.env.VITE_MAPBOX_STYLE as string | undefined) ??
  "mapbox://styles/mapbox/satellite-streets-v12";

export const STYLE_STORAGE_KEY = "seqwater.map.style";
export const PROJECTION_STORAGE_KEY = "seqwater.map.projection";
export const TERRAIN_STORAGE_KEY = "seqwater.map.terrain";
export const BUILDINGS_STORAGE_KEY = "seqwater.map.buildings";

export function findStyleOption(url: string | undefined): MapStyleOption | undefined {
  if (!url) return undefined;
  return MAPBOX_STYLES.find((s) => s.url === url);
}

export function loadString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

export function persist(key: string, value: string | boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage may be disabled */
  }
}
