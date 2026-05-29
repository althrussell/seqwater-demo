import { Navigate, Route, Routes } from "react-router-dom";
import CommandCentreShell from "./components/CommandCentreShell";
import ExecutiveOverview from "./pages/ExecutiveOverview";
import WaterSecurityMap from "./pages/WaterSecurityMap";
import AssetRisk from "./pages/AssetRisk";
import WaterQuality from "./pages/WaterQuality";
import FloodReadiness from "./pages/FloodReadiness";
import AquaIQAssistant from "./pages/AquaIQAssistant";
import BoardBriefing from "./pages/BoardBriefing";
import Governance from "./pages/Governance";

export default function App() {
  return (
    <CommandCentreShell>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<ExecutiveOverview />} />
        <Route path="/map" element={<WaterSecurityMap />} />
        <Route path="/assets" element={<AssetRisk />} />
        <Route path="/quality" element={<WaterQuality />} />
        <Route path="/flood" element={<FloodReadiness />} />
        <Route path="/aquaiq" element={<AquaIQAssistant />} />
        <Route path="/briefing" element={<BoardBriefing />} />
        <Route path="/governance" element={<Governance />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </CommandCentreShell>
  );
}
