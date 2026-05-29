import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { X, Wrench, Sparkles } from "lucide-react";
import RiskBadge from "./RiskBadge";
import TrendSparkline from "./TrendSparkline";
import { cn, fmtNumber } from "@/lib/utils";

interface AssetDrawerProps {
  assetId: string | null;
  onClose: () => void;
}

export default function AssetDrawer({ assetId, onClose }: AssetDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => api.asset(assetId as string),
    enabled: Boolean(assetId),
  });

  if (!assetId) return null;

  const asset = (data ?? {}) as Record<string, any>;
  const risk = asset.risk as
    | undefined
    | {
        risk_band: string;
        risk_score: number;
        predicted_failure_30d: number;
        open_work_orders: number;
        recommended_action: string;
        health_index: number;
      };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-30 w-full max-w-[480px] transform border-l border-white/10 bg-ink-900/95 shadow-elevated backdrop-blur-md transition-transform",
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
            Synthetic asset detail
          </div>
          <h2 className="mt-1 text-base font-semibold text-ink-50">
            {asset.name ?? assetId}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-300">
            <span>{asset.asset_type ?? "—"}</span>
            <span>·</span>
            <span>{asset.region ?? "—"}</span>
            <span>·</span>
            <span>Commissioned {asset.commissioned_year ?? "—"}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn-ghost h-8 w-8 p-0"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="scrollbar-clean h-[calc(100vh-77px)] overflow-y-auto px-5 py-5">
        {isLoading ? <Skeleton /> : null}
        {risk ? (
          <section className="panel mb-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-ink-300">
                Risk posture
              </h3>
              <RiskBadge band={risk.risk_band} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Score" value={risk.risk_score.toFixed(2)} />
              <Stat
                label="30d failure"
                value={`${(risk.predicted_failure_30d * 100).toFixed(0)}%`}
              />
              <Stat label="Open WOs" value={String(risk.open_work_orders)} />
            </div>
            <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-ink-200">
              <span className="text-[10px] uppercase tracking-wider text-ink-300">
                Synthetic AI risk narrative
              </span>
              <br />
              {risk.recommended_action}
            </p>
          </section>
        ) : null}

        {asset.storage_trend && asset.storage_trend.length > 0 ? (
          <section className="panel mb-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-ink-300">
                Synthetic storage % (60d)
              </h3>
              <span className="text-[11px] text-ink-300">Daily</span>
            </div>
            <div className="mt-2">
              <TrendSparkline data={asset.storage_trend} height={70} stroke="#3FA1F2" yLabel="%" />
            </div>
          </section>
        ) : null}

        {asset.health_trend && asset.health_trend.length > 0 ? (
          <section className="panel mb-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-ink-300">
                Synthetic health index (60d)
              </h3>
              <span className="text-[11px] text-ink-300">Daily</span>
            </div>
            <div className="mt-2">
              <TrendSparkline data={asset.health_trend} height={70} stroke="#5DDCD0" yLabel="health" />
            </div>
          </section>
        ) : null}

        <section className="panel mb-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider text-ink-300">
              Recent synthetic work orders
            </h3>
            <Wrench className="h-3.5 w-3.5 text-ink-300" />
          </div>
          <ul className="mt-2 space-y-2 text-xs">
            {(asset.work_orders ?? []).slice(0, 5).map((w: any) => (
              <li
                key={w.work_order_id}
                className="flex items-start justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
              >
                <div>
                  <div className="font-mono text-[11px] text-ink-100">
                    {w.work_order_id}
                  </div>
                  <div className="text-ink-300">{w.description}</div>
                </div>
                <div className="ml-3 text-right text-[11px] text-ink-300">
                  <div>{w.priority}</div>
                  <div className="text-ink-300">{w.status}</div>
                  <div className="text-ink-300">{w.age_days}d</div>
                </div>
              </li>
            ))}
            {(!asset.work_orders || asset.work_orders.length === 0) ? (
              <li className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-ink-300">
                No synthetic work orders.
              </li>
            ) : null}
          </ul>
        </section>

        {asset.recent_quality_samples && asset.recent_quality_samples.length > 0 ? (
          <section className="panel mb-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-ink-300">
                Recent synthetic quality samples
              </h3>
              <Sparkles className="h-3.5 w-3.5 text-ink-300" />
            </div>
            <ul className="mt-2 space-y-1.5 text-xs">
              {asset.recent_quality_samples.slice(0, 5).map((s: any) => (
                <li
                  key={s.sample_id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5"
                >
                  <div className="font-mono text-[11px] text-ink-100">{s.sample_id}</div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-ink-300">{fmtNumber(s.turbidity_NTU, { maximumFractionDigits: 2 })} NTU</span>
                    <RiskBadge band={s.alert_level} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-3 text-[11px] leading-relaxed text-ink-300">
          Every value above is synthetic and tagged with a `synthetic_demo_flag`.
          Human validation is required before any operational decision.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-300">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-ink-50">{value}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}
