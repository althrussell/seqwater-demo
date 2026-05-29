import { cn } from "@/lib/utils";
import {
  Database,
  KeyRound,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GovernanceTile as GovernanceTileType } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  database: Database,
  sparkles: Sparkles,
  "shield-check": ShieldCheck,
  key: KeyRound,
  "trending-down": TrendingDown,
};

const ACCENTS: Record<string, string> = {
  blue: "from-water-500/20 to-water-500/0 border-water-500/30 text-water-100",
  violet: "from-fuchsia-500/20 to-fuchsia-500/0 border-fuchsia-500/30 text-fuchsia-100",
  emerald: "from-catchment-500/20 to-catchment-500/0 border-catchment-500/30 text-catchment-100",
  amber: "from-amberop-500/20 to-amberop-500/0 border-amberop-500/30 text-amberop-100",
  rose: "from-risk-500/20 to-risk-500/0 border-risk-500/30 text-risk-100",
};

export default function GovernanceTile({ tile }: { tile: GovernanceTileType }) {
  const Icon = ICONS[tile.icon] ?? ShieldCheck;
  const accent = ACCENTS[tile.accent] ?? ACCENTS.blue;
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-white/[0.02] p-5", accent)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accent.split(" ").slice(0, 2).join(" "))} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
            Governance
          </div>
          <h3 className="mt-1 text-base font-semibold text-ink-50">
            {tile.title}
          </h3>
          <p className="mt-1 text-sm text-ink-200">{tile.summary}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <ul className="relative mt-4 space-y-1.5 text-xs text-ink-200">
        {tile.detail.map((d, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-current opacity-60" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
