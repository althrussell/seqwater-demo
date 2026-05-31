import { NavLink } from "react-router-dom";
import { HelpCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import SeqwaterLogo from "./SeqwaterLogo";
import { NAV_GROUPS, type NavItem } from "./navConfig";

export default function LeftRail() {
  return (
    <aside className="sticky top-0 z-[900] hidden h-screen w-[260px] flex-none flex-col border-r border-border bg-surface lg:flex">
      <div className="border-b border-border px-5 py-5">
        <SeqwaterLogo />
      </div>

      <nav className="scrollbar-clean mt-2 flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-4">
        {NAV_GROUPS.map((group, idx) => (
          <div key={group.heading} className={cn("flex flex-col", idx === 0 && "mt-1")}>
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted/80">
              {group.heading}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavRailLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-2.5 py-3">
        <UtilityLink to="#" icon={HelpCircle} label="Help & Support" />
        <UtilityLink to="#" icon={Settings} label="My Settings" />
      </div>
    </aside>
  );
}

function NavRailLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition",
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
