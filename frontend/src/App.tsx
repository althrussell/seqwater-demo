import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/shell/AppShell";
import ExecutiveOverview from "./pages/ExecutiveOverview";
import SeqWaterGridMap from "./pages/SeqWaterGridMap";
import WaterSecuritySupply from "./pages/WaterSecuritySupply";
import AssetResilience from "./pages/AssetResilience";
import WaterQualityAssurance from "./pages/WaterQualityAssurance";
import FloodReadinessScenario from "./pages/FloodReadinessScenario";
import AquaIQAssistant from "./pages/AquaIQAssistant";
import AquaIQBriefingAnalyst from "./pages/AquaIQBriefingAnalyst";
import GenieExplorer from "./pages/GenieExplorer";
import GovernancePlatform from "./pages/GovernancePlatform";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<ExecutiveOverview />} />
        <Route path="/map" element={<SeqWaterGridMap />} />
        <Route path="/supply" element={<WaterSecuritySupply />} />
        <Route path="/assets" element={<AssetResilience />} />
        <Route path="/quality" element={<WaterQualityAssurance />} />
        <Route path="/flood" element={<FloodReadinessScenario />} />
        <Route path="/aquaiq" element={<AquaIQAssistant />} />
        <Route path="/aquaiq/briefing" element={<AquaIQBriefingAnalyst />} />
        <Route path="/genie" element={<GenieExplorer />} />
        <Route path="/governance" element={<GovernancePlatform />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </AppShell>
  );
}
