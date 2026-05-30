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
  "Show the 7-day storage trend for North Pine Dam vs Wivenhoe.",
  "Which assets are in High or Critical risk band today?",
  "Top 10 water quality samples by turbidity in the last 30 days.",
  "How many open critical work orders per region?",
  "Projected storage trajectory for flood scenario FS-001.",
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
    <div className="flex h-[var(--page-h)] min-h-0 flex-col gap-2">
      <div className="flex flex-none flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primaryBlue" />
          <div className="text-[12.5px] font-semibold text-deepNavy">Genie Space</div>
          <span className="hidden text-[11px] text-ink-muted sm:inline">
            Seqwater Operations — natural language → SQL over Unity Catalog
          </span>
        </div>
        <div className="ml-auto flex flex-none items-center gap-1.5">
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium " +
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
              ? `space ${config?.space_id ?? ""}`
              : status.kind}
          </span>
          <span className="hidden items-center gap-1 text-[10.5px] text-ink-muted md:inline-flex">
            <ShieldCheck className="h-3 w-3 text-primaryBlue" />
            Governed access · UC permissions
          </span>
          {config?.configured ? (
            <>
              <button
                type="button"
                onClick={reloadIframe}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
              >
                <RefreshCw className="h-3 w-3" /> Reload
              </button>
              {config.embed_url ? (
                <a
                  href={config.embed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-ink-secondary hover:border-primaryBlue/40 hover:text-deepNavy"
                >
                  <ExternalLink className="h-3 w-3" /> Open in Databricks
                </a>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="flex w-full flex-none items-center gap-1.5 overflow-hidden border-t border-border pt-1.5">
          <span className="flex-none text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Try
          </span>
          <div className="scrollbar-clean flex flex-1 items-center gap-1.5 overflow-x-auto">
            {SAMPLE_PROMPTS.map((p) => (
              <span
                key={p}
                className="flex-none rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10.5px] text-ink-secondary"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <SectionCard padded={false} bodyClassName="p-0 min-h-0" className="min-h-0 flex-1">
        {status.kind === "ready" && config?.embed_url ? (
          <div className="relative h-full min-h-0 w-full overflow-hidden rounded-b-lg">
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
      <div className="flex h-full min-h-0 items-center justify-center text-[13px] text-ink-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving Genie embed configuration…
      </div>
    );
  }
  return (
    <div className="scrollbar-clean flex h-full min-h-0 flex-col items-center justify-center gap-3 overflow-auto px-6 py-4 text-center">
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
