/**
 * Stylised synthetic SEQ catchment polygons. Not geographically authoritative;
 * tuned for visual narrative on the SEQ Water Grid Map page.
 *
 * Coordinates are stored as GeoJSON [lon, lat] tuples so they can be fed
 * straight into a Mapbox GL `geojson` source.
 */

export type LngLat = [number, number];

export interface CatchmentPoly {
  id: string;
  name: string;
  fill: string;
  rainfallMm: number; // synthetic 72h forecast
  /** Outer ring, [lon, lat]. */
  ring: LngLat[];
}

export const CATCHMENTS: CatchmentPoly[] = [
  {
    id: "brisbane",
    name: "Brisbane Catchment",
    fill: "#5FA777",
    rainfallMm: 86,
    ring: [
      [152.4, -27.05],
      [152.7, -26.85],
      [153.0, -26.95],
      [153.05, -27.3],
      [152.95, -27.55],
      [152.65, -27.55],
      [152.45, -27.3],
    ],
  },
  {
    id: "pine",
    name: "Pine Catchment",
    fill: "#7FA77B",
    rainfallMm: 108,
    ring: [
      [152.75, -26.85],
      [152.95, -26.6],
      [153.1, -26.7],
      [153.05, -27.0],
      [152.85, -27.0],
    ],
  },
  {
    id: "sunshine",
    name: "Maroochy Catchment",
    fill: "#69B147",
    rainfallMm: 132,
    ring: [
      [152.85, -26.6],
      [152.95, -26.3],
      [153.15, -26.3],
      [153.2, -26.55],
      [153.1, -26.7],
    ],
  },
  {
    id: "logan",
    name: "Logan Catchment",
    fill: "#92CD6F",
    rainfallMm: 62,
    ring: [
      [152.8, -27.55],
      [153.1, -27.55],
      [153.15, -27.85],
      [152.85, -27.95],
      [152.7, -27.85],
    ],
  },
  {
    id: "gold-coast",
    name: "Gold Coast Catchment",
    fill: "#BFE3A4",
    rainfallMm: 44,
    ring: [
      [153.15, -27.85],
      [153.45, -27.85],
      [153.45, -28.15],
      [153.2, -28.2],
      [153.1, -27.95],
    ],
  },
];

/** Rainfall colour scale matching the legend in MapLegend.RainfallLegend. */
export function rainfallColor(mm: number): string {
  if (mm < 10) return "#EEF8F2";
  if (mm < 25) return "#D8F0FB";
  if (mm < 50) return "#86CFE5";
  if (mm < 100) return "#5FA777";
  if (mm < 150) return "#D88A00";
  return "#C2410C";
}

/** Convert catchments to a GeoJSON FeatureCollection for a Mapbox source. */
export function catchmentsFeatureCollection(): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: CATCHMENTS.map((c) => ({
      type: "Feature",
      id: c.id,
      properties: {
        id: c.id,
        name: c.name,
        rainfallMm: c.rainfallMm,
        fill: c.fill,
        rainfallColor: rainfallColor(c.rainfallMm),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[...c.ring, c.ring[0]]],
      },
    })),
  };
}
