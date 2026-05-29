import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { BriefingResponse } from "@/lib/types";
import {
  Copy,
  Download,
  FileText,
  Loader2,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import SourceCitationCard from "./SourceCitationCard";

export default function BoardBriefingPanel({
  defaultAudience = "board",
  scenarioId,
  className,
}: {
  defaultAudience?: string;
  scenarioId?: string;
  className?: string;
}) {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [audience, setAudience] = useState(defaultAudience);

  const generate = useMutation({
    mutationFn: async () =>
      api.briefing({ audience, scenario_id: scenarioId }),
    onSuccess: setBriefing,
  });

  const copy = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing.markdown);
  };
  const download = () => {
    if (!briefing) return;
    const blob = new Blob([briefing.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${briefing.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="panel-elevated p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
              Synthetic board briefing generator
            </div>
            <h3 className="mt-0.5 text-base font-semibold text-ink-50">
              Turn synthetic command-centre context into a board-ready brief
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-ink-300">
              AquaIQ assembles the briefing from synthetic risk, storage, water
              quality, capital, and document context. Every section cites
              synthetic sources and requires human validation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="input w-auto"
            >
              <option value="board">Board</option>
              <option value="executive">Executive</option>
              <option value="operations">Operations</option>
            </select>
            <button
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
              className="btn-primary"
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate briefing
            </button>
          </div>
        </div>
      </div>

      {!briefing ? (
        <EmptyBriefing />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="panel-elevated lg:col-span-2">
            <header className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-water-grad shadow-glow">
                  <ScrollText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-300">
                    {audience} briefing — synthetic
                  </div>
                  <div className="-mt-0.5 text-sm font-semibold text-ink-50">
                    {briefing.title}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copy} className="btn-ghost text-xs">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <button onClick={download} className="btn-ghost text-xs">
                  <Download className="h-3.5 w-3.5" /> Markdown
                </button>
              </div>
            </header>
            <div className="scrollbar-clean max-h-[68vh] overflow-y-auto px-6 py-5">
              <article className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-ink-50 prose-p:text-ink-200 prose-li:text-ink-200 prose-table:text-xs prose-th:text-ink-100 prose-td:text-ink-200 prose-strong:text-ink-50">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {briefing.markdown}
                </ReactMarkdown>
              </article>
            </div>
          </article>

          <aside className="space-y-3">
            <div className="panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ink-300">
                  Briefing metadata
                </span>
                <ShieldCheck className="h-3.5 w-3.5 text-catchment-400" />
              </div>
              <ul className="space-y-1 text-xs text-ink-200">
                <li><span className="text-ink-300">Trace</span> <span className="font-mono text-ink-100">{briefing.trace_id}</span></li>
                <li><span className="text-ink-300">Generated</span> {new Date(briefing.generated_at).toLocaleString()}</li>
                <li><span className="text-ink-300">Audience</span> {briefing.audience}</li>
                <li className="text-amberop-100">
                  Human validation required before circulation.
                </li>
              </ul>
            </div>

            <div className="panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-ink-300">
                  Synthetic sources
                </span>
                <FileText className="h-3.5 w-3.5 text-ink-300" />
              </div>
              <SourceCitationCard citations={briefing.sources_used} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyBriefing() {
  return (
    <div className="panel grid place-items-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-water-grad shadow-glow">
        <ScrollText className="h-5 w-5 text-white" />
      </div>
      <h4 className="mt-3 text-base font-semibold text-ink-50">
        No briefing generated yet
      </h4>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-300">
        Press "Generate briefing" to assemble a synthetic, traceable, board-ready
        situation summary from the synthetic command-centre context.
      </p>
    </div>
  );
}
