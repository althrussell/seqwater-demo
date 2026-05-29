import {
  ArrowRight,
  Check,
  Database,
  FileText,
  GitBranch,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SourceType = "table" | "document" | "workflow" | "model" | "view";

interface SourceChipDef {
  label: string;
  type: SourceType;
}

interface Props {
  title?: string;
  description?: string;
  body: string;
  evidence?: string[];
  recommendedReview?: string[];
  sources?: SourceChipDef[];
  /** Compact sources (just icon badges) used by the simple layout. */
  sourceIcons?: SourceChipDef[];
  updatedLabel?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

const ICON: Record<SourceType, typeof Database> = {
  table: Database,
  document: FileText,
  workflow: GitBranch,
  model: Sparkles,
  view: Layers,
};

export default function AquaIQSummaryCard({
  title = "AquaIQ Executive Summary",
  description = "AI-generated summary using governed data, operational signals and document intelligence.",
  body,
  evidence,
  recommendedReview,
  sources,
  sourceIcons,
  updatedLabel,
  ctaLabel = "View full explanation",
  onCta,
  className,
}: Props) {
  const isPremium = Boolean(
    (evidence && evidence.length > 0) ||
      (recommendedReview && recommendedReview.length > 0) ||
      (sources && sources.length > 0),
  );

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-surface shadow-card",
        className,
      )}
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-blue text-primaryBlue">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-deepNavy">
              {title}
            </div>
            <div className="text-[11.5px] text-ink-muted">{description}</div>
          </div>
        </div>
        {onCta ? (
          <button
            onClick={onCta}
            className="hidden items-center gap-1 text-[12.5px] font-semibold text-primaryBlue hover:text-deepBlue md:inline-flex"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </header>

      {isPremium ? (
        <div className="grid grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel>Summary</SectionLabel>
            <div className="mt-2 rounded-lg border border-surface-blueStrong/60 bg-surface-blue/60 p-4 text-[13.5px] leading-[1.6] text-deepNavy">
              {body}
            </div>
            {recommendedReview && recommendedReview.length > 0 ? (
              <div className="mt-5">
                <SectionLabel>Recommended review</SectionLabel>
                <ul className="mt-2 space-y-1.5">
                  {recommendedReview.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-ink-secondary"
                    >
                      <span className="mt-1 inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border border-seqwaterGreen/40 bg-surface-green text-seqwaterGreen">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="lg:col-span-5">
            {evidence && evidence.length > 0 ? (
              <>
                <SectionLabel>Key evidence</SectionLabel>
                <ul className="mt-2 space-y-1.5">
                  {evidence.map((e) => (
                    <li
                      key={e}
                      className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-ink-secondary"
                    >
                      <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-primaryBlue" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex-1 px-5 py-5">
          <div className="rounded-md bg-surface-blue/60 p-4 text-[13px] leading-[1.55] text-deepNavy">
            {body}
          </div>
          {onCta ? (
            <button
              onClick={onCta}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-primaryBlue hover:text-deepBlue"
            >
              {ctaLabel}
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      )}

      <footer
        className={cn(
          "flex flex-wrap items-center gap-3 border-t border-border px-5 py-3",
          isPremium ? "" : "",
        )}
      >
        {sources && sources.length > 0 ? (
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
              Sources
            </span>
            {sources.map((s) => {
              const Icon = ICON[s.type];
              return (
                <span
                  key={s.label}
                  className="inline-flex max-w-[260px] items-center gap-1.5 truncate rounded-full border border-border bg-surface-blue/40 px-2.5 py-1 text-[11.5px] font-medium text-ink-secondary"
                  title={s.label}
                >
                  <Icon className="h-3 w-3 flex-none text-primaryBlue" />
                  <span className="truncate">{s.label}</span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-1.5 text-ink-muted">
            <span className="text-[10.5px] uppercase tracking-wider">Sources</span>
            <div className="ml-1 flex items-center gap-1">
              {(sourceIcons ?? []).map((s) => {
                const Icon = ICON[s.type];
                return (
                  <span
                    key={s.label}
                    title={s.label}
                    className="flex h-5 w-5 items-center justify-center rounded border border-border bg-surface-blue/40 text-primaryBlue"
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {updatedLabel ? (
          <div className="text-[11px] text-ink-muted">{updatedLabel}</div>
        ) : null}
      </footer>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
      {children}
    </div>
  );
}
