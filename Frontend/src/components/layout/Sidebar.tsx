import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Bell, UserCircle2, Activity,
  Sparkles, FileBarChart, ScrollText, Settings, Heart,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

const sections = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Scenario 2 — Mental Health",
    items: [
      { to: "/cases", label: "Cases", icon: Users },
      { to: "/appointments", label: "Appointments", icon: Calendar },
      { to: "/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    label: "Scenario 3 — Digital Behavior",
    items: [
      { to: "/youth-profiles", label: "Youth Profiles", icon: UserCircle2 },
      { to: "/risk-monitor", label: "Risk Monitor", icon: Activity },
      { to: "/awareness-actions", label: "Awareness Actions", icon: Sparkles },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/reports", label: "Reports", icon: FileBarChart },
      { to: "/audit-log", label: "Audit Log", icon: ScrollText },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const roleBadgeClass = (role: string) =>
  role === "Admin"
    ? "bg-info/10 text-info border-info/20"
    : role === "Counselor"
    ? "bg-teal/10 text-teal border-teal/30"
    : "bg-muted text-muted-foreground border-border";

export default function Sidebar() {
  const { currentUser } = useApp();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Heart className="w-4 h-4 text-teal" fill="currentColor" />
        </div>
        <div>
          <div className="text-base font-semibold tracking-tight">Amal</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Youth Wellbeing</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((s) => (
          <div key={s.label}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <ul className="space-y-0.5">
              {s.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`
                    }
                  >
                    <it.icon className="w-4 h-4" />
                    <span>{it.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {currentUser.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{currentUser.name}</div>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${roleBadgeClass(currentUser.role)}`}>
            {currentUser.role}
          </span>
        </div>
      </div>
    </aside>
  );
}
