import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Maximize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import HeroBanner from "@/components/ui/HeroBanner";
import KpiCard from "@/components/ui/KpiCard";
import ExecutivePriorityCard from "@/components/ui/ExecutivePriorityCard";
import AquaIQSummaryCard from "@/components/ui/AquaIQSummaryCard";
import SectionCard from "@/components/ui/SectionCard";
import SeqWaterMap from "@/components/map/SeqWaterMap";
import MapLegend from "@/components/ui/MapLegend";
import {
  EXECUTIVE_AI_EVIDENCE,
  EXECUTIVE_AI_REVIEW,
  EXECUTIVE_AI_SOURCES,
  EXECUTIVE_AI_SUMMARY,
  EXECUTIVE_KPIS,
  EXECUTIVE_PRIORITIES,
  HERO_IMAGES,
} from "@/lib/demoContent";
import { api } from "@/lib/api";
import { useAppContext } from "@/components/shell/AppContext";

const PREVIEW_LAYERS = ["assets", "catchment", "rainfall", "quality", "risk"];

export default function ExecutiveOverview() {
  const navigate = useNavigate();
  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview });
  void overview;
  const assets = useQuery({ queryKey: ["assets"], queryFn: api.assets });
  const { scenarioId } = useAppContext();
  void scenarioId;

  const mapAssets = useMemo(() => {
    return (assets.data ?? [])
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => ({
        asset_id: a.asset_id,
        name: a.name,
        asset_type: a.asset_type,
        region: a.region,
        lat: a.lat as number,
        lon: a.lon as number,
      }));
  }, [assets.data]);

  return (
    <div className="space-y-6">
      <HeroBanner
        image={HERO_IMAGES.executiveOverview}
        eyebrow="Executive Overview"
        headline={
          "Water security remains stable, with elevated\nmonitoring across catchments and assets."
        }
        sub="Regular monitoring continues across the water grid."
        cta={{ label: "View full executive brief", onClick: () => navigate("/aquaiq") }}
        posture={{
          status: "watch",
          description:
            "Elevated monitoring in place for selected catchments, assets and water quality indicators.",
        }}
        height={340}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
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
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-10">
        <SectionCard
          title="SEQ Water Grid at a glance"
          description="Synthetic overview of dams, treatment plants, pump stations and pipelines."
          className="lg:col-span-6"
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
            <div className="h-[380px] overflow-hidden rounded-b-lg">
              <SeqWaterMap
                assets={mapAssets}
                layers={PREVIEW_LAYERS}
                preview
                initialZoom={8}
                height={380}
                className="border-0 rounded-none"
              />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] hidden md:block">
              <MapLegend className="pointer-events-auto w-[200px]" />
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

        <SectionCard
          title="Executive Priorities"
          description="Action items raised for executive review this morning."
          className="lg:col-span-4"
          actions={
            <button
              onClick={() => navigate("/aquaiq")}
              className="text-[12.5px] font-semibold text-primaryBlue hover:text-deepBlue"
            >
              View all actions →
            </button>
          }
        >
          <div className="space-y-2.5">
            {EXECUTIVE_PRIORITIES.map((p) => (
              <ExecutivePriorityCard
                key={p.title}
                title={p.title}
                description={p.description}
                icon={p.icon}
                status={p.status}
                onClick={() => navigate("/aquaiq")}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <AquaIQSummaryCard
        body={EXECUTIVE_AI_SUMMARY}
        evidence={EXECUTIVE_AI_EVIDENCE}
        recommendedReview={EXECUTIVE_AI_REVIEW}
        sources={EXECUTIVE_AI_SOURCES}
        updatedLabel="Last updated 09:10 AM AEST"
        onCta={() => navigate("/aquaiq")}
      />
    </div>
  );
}
