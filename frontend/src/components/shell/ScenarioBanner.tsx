import { AnimatePresence, motion } from "framer-motion";
import { useAppContext } from "@/components/shell/AppContext";
import { getScenarioOverlay } from "@/lib/scenarios";
import { cn } from "@/lib/utils";

/**
 * Universal scenario banner. Renders just below the app header on every page
 * so the active scenario context is always visible. Keeps the demo honest
 * about which posture the executives are reviewing.
 */
export default function ScenarioBanner() {
  const { scenarioId } = useAppContext();
  const overlay = getScenarioOverlay(scenarioId);
  const Icon = overlay.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={overlay.id}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex h-10 flex-none flex-nowrap items-center gap-2.5 overflow-hidden rounded-md border px-3 py-1.5 text-[12px] shadow-soft",
          overlay.accentClass,
        )}
      >
        <span className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/70">
          <Icon className="h-3 w-3" />
        </span>
        <div className="flex min-w-0 flex-1 items-baseline gap-2 truncate">
          <span className="font-semibold truncate">{overlay.bannerTitle}</span>
          <span className="text-ink-muted">·</span>
          <span className="truncate text-[11.5px] text-ink-secondary">
            {overlay.bannerBody}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
