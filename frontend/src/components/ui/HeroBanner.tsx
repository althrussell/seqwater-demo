import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge, { type Status } from "./StatusBadge";

interface HeroBannerProps {
  image: string;
  eyebrow?: string;
  headline: string;
  sub?: string;
  cta?: { label: string; onClick?: () => void; href?: string };
  posture?: {
    status: Status;
    description: string;
    explanationLabel?: string;
    onExplain?: () => void;
  };
  height?: number;
  className?: string;
}

export default function HeroBanner({
  image,
  eyebrow,
  headline,
  sub,
  cta,
  posture,
  height = 160,
  className,
}: HeroBannerProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-border shadow-card",
        className,
      )}
      style={{ height }}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: "saturate(1.05) brightness(1.02)" }}
        loading="eager"
      />
      {/* Left-to-right navy gradient behind the text only — keeps the
          right side of the photograph (water + landscape) clean. */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(8,32,58,0.78) 0%, rgba(8,32,58,0.62) 28%, rgba(8,32,58,0.34) 52%, rgba(8,32,58,0.06) 72%, rgba(8,32,58,0) 100%)",
        }}
      />
      {/* Soft photographic vignette — adds depth without flattening the photo. */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,32,58,0.18) 82%, rgba(8,32,58,0.32) 100%)",
        }}
      />
      <div className="relative grid h-full grid-cols-1 items-center gap-3 px-6 py-4 lg:grid-cols-12 lg:px-8">
        <div className="flex min-w-0 flex-col gap-2 text-white lg:col-span-8">
          {eyebrow ? (
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="max-w-[820px] text-[20px] font-semibold leading-[1.18] tracking-tight whitespace-pre-line drop-shadow-[0_2px_24px_rgba(10,46,77,0.55)] lg:text-[24px]">
            {headline}
          </h2>
          {sub ? (
            <p className="max-w-[640px] text-[12.5px] leading-snug text-white/90 drop-shadow-[0_1px_12px_rgba(10,46,77,0.55)]">
              {sub}
            </p>
          ) : null}
          {cta ? (
            <div className="mt-1">
              {cta.href ? (
                <a
                  href={cta.href}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/25"
                >
                  {cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <button
                  onClick={cta.onClick}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur transition hover:bg-white/25"
                >
                  {cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : null}
        </div>
        {posture ? (
          <div className="lg:col-span-4 lg:flex lg:justify-end">
            <PostureCard {...posture} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PostureCard({
  status,
  description,
  explanationLabel = "What does this mean?",
  onExplain,
}: NonNullable<HeroBannerProps["posture"]>) {
  return (
    <div className="w-full max-w-[260px] rounded-xl border border-white/30 bg-white/95 p-3 shadow-elevated backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        Overall Posture
      </div>
      <div className="mt-1.5">
        <StatusBadge status={status} showIcon className="text-[12px] px-2.5 py-1" />
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-ink-secondary">
        {description}
      </p>
      <button
        onClick={onExplain}
        className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-primaryBlue hover:text-deepBlue"
      >
        {explanationLabel}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
