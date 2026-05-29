import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import { api } from "@/lib/api";
import type { GenieEmbedResponse } from "@/lib/types";

const SAMPLE_PROMPTS = [
  "Show the synthetic 7-day storage trend for North Pine Dam vs Wivenhoe.",
  "Which synthetic assets are in High or Critical risk band today?",
  "Top 10 synthetic water quality samples by turbidity in the last 30 days.",
  "How many synthetic open critical work orders per region?",
  "Synthetic projected storage trajectory for flood scenario FS-001.",
];

export default function GenieExplorer() {
  const [config, setConfig] = useState<GenieEmbedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const load = () => {
    setError(null);
    setConfig(null);
    api
      .genieEmbed()
      .then((r) => setConfig(r))
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const reloadIframe = () => setIframeKey((k) => k + 1);

  const status = useMemo(() => {
    if (error) return { kind: "error" as const, message: error };
    if (!config) return { kind: "loading" as const, message: "Resolving Genie Space…" };
    if (!config.configured) return { kind: "unconfigured" as const, message: config.reason ?? "Not configured" };
    return { kind: "ready" as const, message: "Embedded" };
  }, [config, error]);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Embedded Genie Space"
        description="Synthetic Seqwater Operations — natural language → SQL over Unity Catalog"
        actions={
          <div className="flex items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                (status.kind === "ready"
                  ? "bg-emerald-50 text-emerald-700"
                  : status.kind === "error"
                  ? "bg-rose-50 text-rose-700"
                  : status.kind === "unconfigured"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600")
              }
            >
              {status.kind === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
              {status.kind === "ready" && <Sparkles className="h-3 w-3" />}
              {status.kind === "error" && <AlertTriangle className="h-3 w-3" />}
              {status.kind === "unconfigured" && <AlertTriangle className="h-3 w-3" />}
              {status.kind === "ready"
                ? `Genie space ${config?.space_id ?? ""}`
                : status.kind}
            </span>
            {config?.configured ? (
              <>
                <button
                  type="button"
                  onClick={reloadIframe}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
                >
                  <RefreshCw className="h-3 w-3" /> Reload
                </button>
                {config.embed_url ? (
                  <a
                    href={config.embed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
                  >
                    <ExternalLink className="h-3 w-3" /> Open in Databricks
                  </a>
                ) : null}
              </>
            ) : null}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ArchTile
            icon={Database}
            label="Genie Space"
            body="Seqwater Operations — synthetic UC tables exposed for governed natural-language SQL."
          />
          <ArchTile
            icon={Sparkles}
            label="Embedded as iframe"
            body="Per Databricks docs: Share → Embed space, then paste DATABRICKS_GENIE_EMBED_URL."
          />
          <ArchTile
            icon={ShieldCheck}
            label="Governed access"
            body="Users only see data they have UC permission on. Audit + lineage stay in Unity Catalog."
          />
        </div>
      </SectionCard>

      <SectionCard title="Try a synthetic question" padded={false} bodyClassName="p-3">
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((p) => (
            <span
              key={p}
              className="rounded-full border border-border bg-surface px-3 py-1 text-[11.5px] text-ink-secondary"
            >
              {p}
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard padded={false} bodyClassName="p-0">
        {status.kind === "ready" && config?.embed_url ? (
          <div className="relative w-full overflow-hidden rounded-b-lg" style={{ height: "78vh", minHeight: 560 }}>
            <iframe
              key={iframeKey}
              title="Seqwater Genie Space"
              src={config.embed_url}
              allow="clipboard-write"
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <EmptyState
            kind={status.kind}
            message={status.message}
            embedUrl={config?.embed_url ?? null}
            onRetry={load}
          />
        )}
      </SectionCard>
    </div>
  );
}

function ArchTile({
  icon: Icon,
  label,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  body: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <div className="flex items-center gap-2 text-[11.5px] font-semibold text-deepNavy">
        <Icon className="h-3.5 w-3.5 text-primaryBlue" />
        {label}
      </div>
      <p className="mt-1 text-[11.5px] text-ink-secondary">{body}</p>
    </div>
  );
}

function EmptyState({
  kind,
  message,
  embedUrl,
  onRetry,
}: {
  kind: "loading" | "error" | "unconfigured" | "ready";
  message: string;
  embedUrl: string | null;
  onRetry: () => void;
}) {
  if (kind === "loading") {
    return (
      <div className="flex h-[60vh] min-h-[420px] items-center justify-center text-[13px] text-ink-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving Genie embed configuration…
      </div>
    );
  }
  return (
    <div className="flex h-[60vh] min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <div className="max-w-xl text-[13px] text-ink-secondary">
        <div className="text-[14px] font-semibold text-deepNavy">
          {kind === "error" ? "Could not load Genie embed" : "Genie Space not configured for embedding"}
        </div>
        <p className="mt-2 leading-relaxed text-ink-muted">{message}</p>
        <ol className="mx-auto mt-3 max-w-md list-decimal space-y-1 pl-5 text-left text-[12.5px] text-ink-muted">
          <li>
            Workspace admin enables <em>Embed Genie as an iframe</em> on the Previews page.
          </li>
          <li>
            Workspace admin adds the App's deployed origin to the allowed embedding surfaces list.
          </li>
          <li>
            Set <code className="rounded bg-[#F4F7FB] px-1 font-mono">DATABRICKS_GENIE_EMBED_URL</code> to
            the URL generated by Genie → Share → Embed space (or set
            <code className="rounded bg-[#F4F7FB] px-1 font-mono">DATABRICKS_HOST</code> +
            <code className="rounded bg-[#F4F7FB] px-1 font-mono">DATABRICKS_GENIE_SPACE_ID</code> for the
            best-effort fallback).
          </li>
          <li>Re-deploy the App and grant users CAN_RUN on the Genie Space + SELECT on the underlying tables.</li>
        </ol>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
        <a
          href="https://docs.databricks.com/aws/en/genie/embed"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Embed docs
        </a>
        {embedUrl ? (
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Genie directly
          </a>
        ) : null}
      </div>
    </div>
  );
}
