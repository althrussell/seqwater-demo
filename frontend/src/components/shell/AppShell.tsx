import LeftRail from "./LeftRail";
import AppHeader from "./AppHeader";
import DemoDisclaimer from "./DemoDisclaimer";
import { AppProvider } from "./AppContext";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="relative min-h-screen bg-canvas">
          <div className="relative flex min-h-screen w-full">
            <LeftRail />
            <main className="flex min-w-0 flex-1 flex-col">
              <AppHeader />
              <div className="flex-1 px-6 pb-8 pt-6 lg:px-10 2xl:px-14">
                <div className="mx-auto w-full max-w-[1640px]">{children}</div>
              </div>
              <DemoDisclaimer />
            </main>
          </div>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
