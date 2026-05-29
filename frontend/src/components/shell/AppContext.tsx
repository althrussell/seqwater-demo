import { createContext, useContext, useMemo, useState } from "react";

interface AppContextValue {
  scenarioId: string;
  setScenarioId: (id: string) => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [scenarioId, setScenarioId] = useState("72h-rainfall-watch");
  const value = useMemo(() => ({ scenarioId, setScenarioId }), [scenarioId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppContext(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppContext must be used within AppProvider");
  return v;
}
