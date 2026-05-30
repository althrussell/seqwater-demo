import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Maximize2 } from "lucide-react";
import HeroBanner from "@/components/ui/HeroBanner";
import KpiCard from "@/components/ui/KpiCard";
import KpiInsightDrawer from "@/components/ui/KpiInsightDrawer";
import ExecutivePriorityCard from "@/components/ui/ExecutivePriorityCard";
import AquaIQSummaryCard from "@/components/ui/AquaIQSummaryCard";
import SectionCard from "@/components/ui/SectionCard";
import SeqWaterMap from "@/components/map/SeqWaterMap";
import MapLegend from "@/components/ui/MapLegend";
import {
  EXECUTIVE_FEATURED_ASSETS,
  EXECUTIVE_KPIS,
  HERO_IMAGES,
  POSTURE_INSIGHT,
  getKpiInsight,
} from "@/lib/demoContent";
import { useAppContext } from "@/components/shell/AppContext";
import { getScenarioOverlay } from "@/lib/scenarios";

const PREVIEW_LAYERS = ["assets", "catchment", "rainfall", "quality", "risk"];

const DEFAULT_HERO_HEADLINE =
  "Water security remains stable, with elevated\nmonitoring across catchments and assets.";

// All 6 of the curated assets carry permanent labels in the executive map.
const FEATURED_LABELLED = EXECUTIVE_FEATURED_ASSETS.map((a) => a.name);

// Five executive-grade source chips for the in-row AquaIQ summary panel —
// keeps the card focused; the full lineage list is on /aquaiq.
const EXEC_INLINE_SOURCES = [
  { label: "Dam storage", type: "table" as const },
  { label: "Rainfall forecast", type: "table" as const },
  { label: "Water quality alerts", type: "table" as const },
  { label: "Asset risk scores", type: "table" as const },
  { label: "Operating procedures", type: "document" as const },
];

type DrawerState =
  | { kind: "kpi"; title: string }
  | { kind: "posture" }
  | null;

export default function ExecutiveOverview() {
  const navigate = useNavigate();
  const { scenarioId } = useAppContext();
  const overlay = getScenarioOverlay(scenarioId);

  const [drawer, setDrawer] = useState<DrawerState>(null);

  // Use the curated synthetic asset set for the executive map preview.
  // Filtering live API data here would over-crowd Brisbane and drift away
  // from the executive narrative; the curated list keeps the panel calm.
  const mapAssets = useMemo(() => EXECUTIVE_FEATURED_ASSETS, []);

  const activeKpiDef = useMemo(() => {
    if (!drawer || drawer.kind !== "kpi") return null;
    return EXECUTIVE_KPIS.find((k) => k.title === drawer.title) ?? null;
  }, [drawer]);

  const activeKpiInsight = useMemo(() => {
    if (!drawer || drawer.kind !== "kpi") return null;
    return getKpiInsight(drawer.title);
  }, [drawer]);

  return (
    <div className="space-y-3.5">
      <HeroBanner
        image={HERO_IMAGES.executiveOverview}
        eyebrow="Executive Overview"
        headline={overlay.heroHeadline ?? DEFAULT_HERO_HEADLINE}
        sub={overlay.heroSub}
        cta={{ label: "View full executive brief", onClick: () => navigate("/aquaiq") }}
        posture={{
          ...overlay.posture,
          onExplain: () => setDrawer({ kind: "posture" }),
        }}
        height={300}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {EXECUTIVE_KPIS.map((k) => (
          <KpiCard
            key={k.title}
            title={k.title}
            value={k.value}
            supportingText={k.supportingText}
            status={k.status}
            icon={k.icon}
            sparklineData={k.spark.length > 0 ? k.spark : undefined}
            sparklineColor={k.sparkColor}
            sparklineVariant={k.sparkVariant}
            onClick={() => setDrawer({ kind: "kpi", title: k.title })}
          />
        ))}
      </div>

      {/* Map (left) + AquaIQ Summary (right) — AquaIQ kept above the fold
          on a 16:9 laptop. Priorities appear immediately beneath the map. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="SEQ Water Grid at a glance"
          description="Synthetic overview of dams, treatment plants, pump stations and pipelines."
          className="lg:col-span-7"
          padded={false}
          actions={
            <button
              onClick={() => navigate("/map")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] font-semibold text-deepNavy transition hover:bg-surface-blue"
            >
              <Maximize2 className="h-3.5 w-3.5 text-primaryBlue" />
              Open
            </button>
          }
        >
          <div className="relative">
            <div className="h-[360px] overflow-hidden rounded-b-lg">
              <SeqWaterMap
                assets={mapAssets}
                layers={PREVIEW_LAYERS}
                preview
                compactMarkers
                cleanBasemap
                styleUrl="mapbox://styles/mapbox/light-v11"
                terrain={false}
                buildings={false}
                disableIntro
                initialZoom={7.6}
                height={360}
                labelledAssetNames={FEATURED_LABELLED}
                layerLabel="Synthetic SEQ Water Grid Layer"
                className="border-0 rounded-none"
              />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] hidden md:block">
              <MapLegend className="pointer-events-auto w-[210px]" />
            </div>
            <button
              onClick={() => navigate("/map")}
              className="absolute bottom-3 right-3 z-[400] inline-flex items-center gap-1.5 rounded-md bg-primaryBlue px-3 py-1.5 text-[12px] font-semibold text-white shadow-card transition hover:bg-deepBlue"
            >
              Open interactive map
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </SectionCard>

        <AquaIQSummaryCard
          variant="inline"
          body={overlay.executiveSummary}
          sources={EXEC_INLINE_SOURCES}
          updatedLabel={`Synthetic — ${overlay.label}`}
          onCta={() => navigate("/aquaiq")}
          className="lg:col-span-5"
        />
      </div>

      <SectionCard
        title="Executive Priorities"
        description="Action items raised for executive review this morning."
        actions={
          <button
            onClick={() => navigate("/aquaiq")}
            className="text-[12.5px] font-semibold text-primaryBlue hover:text-deepBlue"
          >
            View all actions →
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {overlay.priorities.map((p) => (
            <ExecutivePriorityCard
              key={p.title}
              title={p.title}
              description={p.description}
              icon={p.icon}
              status={p.status}
              chipLabel={p.chipLabel}
              evidenceLabel={p.evidenceLabel}
              evidenceType={p.evidenceType}
              onClick={() => navigate("/aquaiq")}
            />
          ))}
        </div>
      </SectionCard>

      {/* KPI / posture insight drawer — single instance, driven by `drawer` state. */}
      {drawer?.kind === "posture" ? (
        <KpiInsightDrawer
          open
          onClose={() => setDrawer(null)}
          kind="posture"
          postureInsight={POSTURE_INSIGHT}
          // 7-day grid storage trend gives the posture header a visual anchor
          sparkline={EXECUTIVE_KPIS[0]?.spark}
          sparklineColor="#0076BE"
          valueCaption={`Live posture: ${overlay.posture.status}`}
        />
      ) : null}
      {drawer?.kind === "kpi" ? (
        <KpiInsightDrawer
          open
          onClose={() => setDrawer(null)}
          kind="kpi"
          insight={activeKpiInsight}
          sparkline={activeKpiDef?.spark}
          sparklineColor={activeKpiDef?.sparkColor}
          sparklineVariant={activeKpiDef?.sparkVariant}
          valueCaption={activeKpiDef?.supportingText}
        />
      ) : null}
    </div>
  );
}
