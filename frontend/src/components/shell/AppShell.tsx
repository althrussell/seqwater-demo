import LeftRail from "./LeftRail";
import AppHeader from "./AppHeader";
import DemoDisclaimer from "./DemoDisclaimer";
import ScenarioBanner from "./ScenarioBanner";
import { AppProvider } from "./AppContext";
import { ToastProvider } from "@/components/ui/Toast";
import AquaIQDock from "@/components/AquaIQDock";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="relative h-dvh overflow-hidden bg-canvas">
          <div className="relative flex h-dvh w-full">
            <LeftRail />
            <main className="flex h-dvh min-w-0 flex-1 flex-col">
              <AppHeader />
              <div
                className="flex min-h-0 flex-1 flex-col gap-2 px-6 pt-2 pb-2 lg:px-8 2xl:px-10"
                style={{
                  // Page area = main height − header (56) − banner (40) − own paddings (16) − disclaimer (32) − gap (8)
                  ["--page-h" as any]: "calc(100dvh - 56px - 40px - 16px - 32px - 8px)",
                }}
              >
                <div className="mx-auto flex min-h-0 w-full max-w-[1640px] flex-1 flex-col gap-2">
                  <ScenarioBanner />
                  <div className="min-h-0 flex-1">{children}</div>
                </div>
              </div>
              <DemoDisclaimer />
            </main>
          </div>
          <AquaIQDock />
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
