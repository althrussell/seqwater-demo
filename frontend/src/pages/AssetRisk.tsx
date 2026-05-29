import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import Section from "@/components/Section";
import RiskBadge from "@/components/RiskBadge";
import AssetDrawer from "@/components/AssetDrawer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Hammer, MessageSquare, Search, Sparkles } from "lucide-react";
import { fmtAUD } from "@/lib/utils";

export default function AssetRisk() {
  const risk = useQuery({ queryKey: ["asset-risk"], queryFn: api.assetRisk });
  const wos = useQuery({ queryKey: ["work-orders"], queryFn: api.workOrders });
  const projects = useQuery({ queryKey: ["capital-projects"], queryFn: api.capitalProjects });
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = risk.data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.asset_name.toLowerCase().includes(q) ||
        r.asset_type.toLowerCase().includes(q) ||
        r.risk_band.toLowerCase().includes(q),
    );
  }, [risk.data, search]);

  const riskByType = useMemo(() => {
    const acc: Record<string, { type: string; total: number; critical: number }> = {};
    (risk.data ?? []).forEach((r) => {
      const key = r.asset_type;
      acc[key] ??= { type: key, total: 0, critical: 0 };
      acc[key].total += 1;
      if (["Critical", "High"].includes(r.risk_band)) acc[key].critical += 1;
    });
    return Object.values(acc);
  }, [risk.data]);

  const woByStatus = useMemo(() => {
    const acc: Record<string, number> = {};
    (wos.data ?? []).forEach((w: any) => {
      const k = w.status as string;
      acc[k] = (acc[k] ?? 0) + 1;
    });
    return Object.entries(acc).map(([status, count]) => ({ status, count }));
  }, [wos.data]);

  const investmentCurve = useMemo(() => {
    const sorted = [...(projects.data ?? [])].sort(
      (a, b) => b.risk_reduction_score - a.risk_reduction_score,
    );
    let cum = 0;
    return sorted.map((p, i) => {
      cum += p.risk_reduction_score;
      return {
        index: i + 1,
        name: p.project_name.split("—")[0]?.trim() ?? p.project_name,
        cumulative: Number(cum.toFixed(2)),
        cost_aud_m: Number((p.estimated_cost_aud / 1_000_000).toFixed(1)),
      };
    });
  }, [projects.data]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <Section title="Risk by synthetic asset type">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskByType}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="type" stroke="#A8A29E" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#A8A29E" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#15161A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#3FA1F2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" fill="#FF6E5A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Synthetic work orders by status">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={woByStatus}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="status" stroke="#A8A29E" fontSize={11} />
                <YAxis stroke="#A8A29E" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#15161A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#5DDCD0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        <Section title="Synthetic capital investment curve" description="Cumulative risk reduction by priority">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={investmentCurve}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="index" stroke="#A8A29E" fontSize={11} />
                <YAxis stroke="#A8A29E" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#15161A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, k: string) => (k === "cumulative" ? [v.toFixed(2), "Cumulative risk reduction"] : [v, "Cost (A$M)"])}
                />
                <Line dataKey="cumulative" stroke="#FF8E76" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <Section
        title="Risk-ranked synthetic asset register"
        description={`${filtered.length} synthetic assets`}
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
            <input
              className="input pl-8 w-64"
              placeholder="Search assets, type, band…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-ink-300">
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Band</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">30d failure</th>
                <th className="px-3 py-2">Open WOs</th>
                <th className="px-3 py-2">Health</th>
                <th className="px-3 py-2 w-[260px]">Recommended action</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.asset_id} className="table-row">
                  <td className="px-3 py-2 font-medium text-ink-50">{r.asset_name}</td>
                  <td className="px-3 py-2 text-ink-200">{r.asset_type}</td>
                  <td className="px-3 py-2"><RiskBadge band={r.risk_band} /></td>
                  <td className="px-3 py-2 font-mono text-ink-100">{r.risk_score.toFixed(2)}</td>
                  <td className="px-3 py-2 text-ink-200">{(r.predicted_failure_30d * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-ink-200">{r.open_work_orders}</td>
                  <td className="px-3 py-2 text-ink-200">{(r.health_index * 100).toFixed(0)}</td>
                  <td className="px-3 py-2 text-ink-200">{r.recommended_action}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="btn-ghost h-7 px-2 text-[11px]"
                      onClick={() => setSelectedId(r.asset_id)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Explain risk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Synthetic maintenance backlog"
        description="P1/P2 first, oldest first"
        actions={
          <span className="pill bg-amberop-500/15 text-amberop-100 border-amberop-500/30">
            Synthetic
          </span>
        }
      >
        <div className="grid gap-2 lg:grid-cols-2">
          {(wos.data ?? []).slice(0, 12).map((w: any) => (
            <div
              key={w.work_order_id}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-ink-100">{w.work_order_id}</span>
                <span className="pill bg-white/[0.05] text-ink-200 border-white/10">{w.priority}</span>
              </div>
              <div className="mt-1.5 text-sm text-ink-50">{w.asset_name}</div>
              <div className="mt-1 text-[12px] text-ink-300">{w.description}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-ink-300">
                <span><Hammer className="mr-1 inline h-3 w-3" />{w.status}</span>
                <span>{w.age_days}d open</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Synthetic capital projects shortlist">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-ink-300">
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Cost</th>
                <th className="px-3 py-2">Risk reduction</th>
                <th className="px-3 py-2">Delivery risk</th>
                <th className="px-3 py-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {(projects.data ?? []).slice(0, 8).map((p) => (
                <tr key={p.project_id} className="table-row">
                  <td className="px-3 py-2 text-ink-50">{p.project_name}</td>
                  <td className="px-3 py-2 text-ink-200">{p.asset_name}</td>
                  <td className="px-3 py-2 text-ink-200">{p.project_type}</td>
                  <td className="px-3 py-2 font-mono text-ink-100">{fmtAUD(p.estimated_cost_aud)}</td>
                  <td className="px-3 py-2 text-ink-200">{p.risk_reduction_score.toFixed(2)}</td>
                  <td className="px-3 py-2 text-ink-200">{p.delivery_risk}</td>
                  <td className="px-3 py-2"><RiskBadge band={priorityToBand(p.recommended_priority)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {selectedId ? (
        <AssetDrawer assetId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function priorityToBand(p: string): string {
  if (p === "P1") return "Critical";
  if (p === "P2") return "High";
  return "Medium";
}
