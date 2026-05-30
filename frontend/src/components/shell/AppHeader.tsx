import { Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import ScenarioSelector from "./ScenarioSelector";
import { useAppContext } from "./AppContext";
import { fmtAEST } from "@/lib/utils";

export default function AppHeader() {
  const { scenarioId, setScenarioId } = useAppContext();

  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-14 flex-none items-center border-b border-border bg-surface/95 px-6 backdrop-blur lg:px-8 2xl:px-10">
      <div className="flex w-full flex-nowrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight text-deepNavy">
            Water for Life Intelligence Centre
          </h1>
        </div>

        <div className="flex flex-none items-center gap-2">
          <ScenarioSelector value={scenarioId} onChange={setScenarioId} />
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-blue/60 px-2.5 py-1 text-[11.5px] font-medium text-primaryBlue transition hover:bg-surface-blue"
            title="All values shown are demonstration data."
          >
            <Info className="h-3.5 w-3.5" />
            Demo data
          </button>
          <div className="hidden items-center gap-2 border-l border-border pl-2 text-[12px] text-ink-secondary md:flex">
            <span>{fmtAEST(now)}</span>
            <button
              type="button"
              onClick={() => setNow(new Date())}
              className="rounded-full p-1 text-ink-muted transition hover:bg-surface-blue hover:text-primaryBlue"
              aria-label="Refresh timestamp"
            >
              <RefreshCw className="h-3.5 w-3.5" />
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
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface p-0.5 text-[11.5px] font-semibold text-deepNavy transition hover:bg-surface-blue/60"
      title="Demo user"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primaryBlue text-[10px] font-semibold text-white">
        {initials}
      </span>
    </button>
  );
}
