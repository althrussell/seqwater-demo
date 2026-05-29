import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Section({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: SectionProps) {
  return (
    <section className={cn("panel-elevated", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-ink-50">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-ink-300">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
