import { Info, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ScenarioSelector from "./ScenarioSelector";
import { NAV } from "./navConfig";
import { useAppContext } from "./AppContext";
import { fmtAEST } from "@/lib/utils";

export default function AppHeader() {
  const location = useLocation();
  const current = NAV.find((n) => location.pathname.startsWith(n.to)) ?? NAV[0];
  const { scenarioId, setScenarioId } = useAppContext();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-[1000] border-b border-border bg-surface/95 px-6 py-3.5 backdrop-blur lg:px-10 2xl:px-14">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-semibold leading-tight text-deepNavy">
            Water for Life Intelligence Centre
          </h1>
          <div className="mt-0.5 truncate text-[13px] text-ink-muted">
            {current.label}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ScenarioSelector value={scenarioId} onChange={setScenarioId} />
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-blue/60 px-3 py-1.5 text-[12px] font-medium text-primaryBlue transition hover:bg-surface-blue"
            title="All values shown are synthetic demonstration data."
          >
            <Info className="h-3.5 w-3.5" />
            Synthetic demo data
          </button>
          <div className="hidden items-center gap-3 border-l border-border pl-3 text-[13px] text-ink-secondary md:flex">
            <span>{fmtAEST(now)}</span>
            <button
              type="button"
              onClick={() => setNow(new Date())}
              className="rounded-full p-1.5 text-ink-muted transition hover:bg-surface-blue hover:text-primaryBlue"
              aria-label="Refresh timestamp"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <UserAvatar initials="AB" />
        </div>
      </div>
    </header>
  );
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-1 py-1 pr-2 text-[12px] font-semibold text-deepNavy transition hover:bg-surface-blue/60"
      title="Demo user"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaryBlue text-[11px] font-semibold text-white">
        {initials}
      </span>
    </button>
  );
}
