import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
}: Props) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-border bg-surface shadow-card",
        className,
      )}
    >
      {title || actions ? (
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {title ? (
              <div className="text-[13px] font-semibold uppercase tracking-[0.12em] text-deepNavy">
                {title}
              </div>
            ) : null}
            {description ? (
              <div className="mt-1 text-[12.5px] text-ink-muted">{description}</div>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn(padded ? "p-5" : "", "flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
