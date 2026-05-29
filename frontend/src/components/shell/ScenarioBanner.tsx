import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "@/components/shell/AppContext";
import { getScenarioOverlay } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

/**
 * Universal scenario banner. Renders just below the app header on every page
 * so the active scenario context is always visible. Keeps the demo honest
 * about which synthetic posture the executives are reviewing.
 */
export default function ScenarioBanner() {
  const { scenarioId } = useAppContext();
  const overlay = getScenarioOverlay(scenarioId);
  const Icon = overlay.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={overlay.id}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22 }}
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-md border px-3.5 py-2 text-[12.5px] shadow-soft",
          overlay.accentClass,
        )}
      >
        <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/70">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight">{overlay.bannerTitle}</div>
          <div className="text-[11.5px] leading-snug text-ink-secondary">
            {overlay.bannerBody}
          </div>
        </div>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
          Synthetic
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
