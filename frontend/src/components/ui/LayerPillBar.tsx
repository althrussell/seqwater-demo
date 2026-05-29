import { useState } from "react";
import {
  AlertTriangle,
  CloudRain,
  Droplets,
  Hammer,
  Layers,
  Leaf,
  MapPin,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface LayerOption {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const MAP_LAYERS: LayerOption[] = [
  { id: "all", label: "All Layers", icon: Layers },
  { id: "assets", label: "Assets", icon: MapPin },
  { id: "quality", label: "Water Quality", icon: Droplets },
  { id: "rainfall", label: "Rainfall Forecast", icon: CloudRain },
  { id: "catchment", label: "Catchment Saturation", icon: Leaf },
  { id: "risk", label: "Asset Risk", icon: AlertTriangle },
  { id: "capital", label: "Capital Projects", icon: Hammer },
];

interface Props {
  active: string[];
  onToggle: (id: string) => void;
  layers?: LayerOption[];
  className?: string;
}

export default function LayerPillBar({
  active,
  onToggle,
  layers = MAP_LAYERS,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {layers.map((l) => {
        const isActive = active.includes(l.id) || (l.id === "all" && active.length === layers.length - 1);
        return (
          <button
            key={l.id}
            onClick={() => onToggle(l.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5 text-[12.5px] font-medium transition",
              isActive
                ? "border-primaryBlue/30 bg-surface-blue text-primaryBlue"
                : "border-border text-ink-secondary hover:border-primaryBlue/30 hover:text-deepBlue",
            )}
          >
            <l.icon className="h-3.5 w-3.5" />
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export function useLayerToggle(initial: string[] = ["assets", "rainfall"]) {
  const [active, setActive] = useState(initial);
  const onToggle = (id: string) => {
    if (id === "all") {
      const allIds = MAP_LAYERS.filter((l) => l.id !== "all").map((l) => l.id);
      setActive((prev) => (prev.length === allIds.length ? [] : allIds));
      return;
    }
    setActive((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };
  return { active, onToggle, setActive };
}
