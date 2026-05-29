import { NavLink } from "react-router-dom";
import { HelpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import SeqwaterLogo from "./SeqwaterLogo";
import { NAV } from "./navConfig";

export default function LeftRail() {
  return (
    <aside className="sticky top-0 z-[900] hidden h-screen w-[260px] flex-none flex-col border-r border-border bg-surface lg:flex">
      <div className="border-b border-border px-5 py-5">
        <SeqwaterLogo />
      </div>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5 px-2.5 pb-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition",
                isActive
                  ? "bg-surface-blue text-primaryBlue"
                  : "text-deepNavy/85 hover:bg-surface-blue/60 hover:text-deepBlue",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] flex-none",
                    isActive ? "text-primaryBlue" : "text-ink-muted group-hover:text-deepBlue",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-2.5 py-3">
        <UtilityLink to="#" icon={HelpCircle} label="Help & Support" />
        <UtilityLink to="#" icon={Settings} label="My Settings" />
      </div>
    </aside>
  );
}

function UtilityLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}) {
  return (
    <a
      href={to}
      className="group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-ink-secondary transition hover:bg-surface-blue/60 hover:text-deepBlue"
    >
      <Icon className="h-[18px] w-[18px] flex-none text-ink-muted group-hover:text-deepBlue" />
      <span>{label}</span>
    </a>
  );
}
