import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Bell, UserCircle2, Activity,
  Sparkles, FileBarChart, ScrollText, Settings,
  UserCog,
  PanelLeftClose, PanelLeft,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import BrandLogo from "@/components/shared/BrandLogo";
import { cn } from "@/lib/utils";

const roleBadgeClass = (role: string) =>
  role === "Admin"
    ? "bg-info/10 text-info border-info/20"
    : role === "Counselor"
    ? "bg-teal/10 text-teal border-teal/30"
    : "bg-muted text-muted-foreground border-border";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { currentUser } = useApp();
  const { t, dir } = useI18n();
  const tooltipSide = dir === "rtl" ? "left" : "right";

  const sections = [
    {
      label: t("nav.overview"),
      items: [{ to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard }],
    },
    {
      label: t("nav.youthSupport"),
      items: [
        { to: "/cases", label: t("nav.mentalHealthCases"), icon: Users },
        { to: "/appointments", label: t("nav.appointments"), icon: Calendar },
        { to: "/alerts", label: t("nav.alerts"), icon: Bell },
        { to: "/youth-profiles", label: t("nav.youthProfiles"), icon: UserCircle2 },
        { to: "/risk-monitor", label: t("nav.riskMonitor"), icon: Activity },
        { to: "/awareness-actions", label: t("nav.awarenessActions"), icon: Sparkles },
      ],
    },
    {
      label: t("nav.platform"),
      items: [
        { to: "/reports", label: t("nav.reports"), icon: FileBarChart },
        { to: "/audit-log", label: t("nav.auditLog"), icon: ScrollText },
        { to: "/settings", label: t("nav.settings"), icon: Settings },
        ...(currentUser.role === "Admin"
          ? [{ to: "/users-management", label: "Users Management", icon: UserCog }]
          : []),
      ],
    },
  ];

  const navLinkClass = (isActive: boolean) =>
    cn(
      "flex items-center rounded-md text-sm transition-colors",
      collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2",
      isActive
        ? "bg-primary/10 text-primary font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent",
    );

  const renderNavItem = (it: { to: string; label: string; icon: typeof LayoutDashboard }) => {
    const link = (
      <NavLink to={it.to} className={({ isActive }) => navLinkClass(isActive)} title={collapsed ? it.label : undefined}>
        <it.icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="truncate">{it.label}</span>}
      </NavLink>
    );

    if (!collapsed) return link;

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side={tooltipSide} className="text-xs">
          {it.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside
      className={cn(
        "sidebar-panel hidden md:flex shrink-0 flex-col border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[4.5rem]" : "w-[15.5rem]",
      )}
    >
      <div
        className={cn(
          "border-b border-sidebar-border shrink-0 bg-sidebar",
          collapsed ? "flex flex-col items-center gap-2 py-3 px-2" : "relative px-3 pt-4 pb-3",
        )}
      >
        <div className={cn("flex justify-center w-full", !collapsed && "pe-9")}>
          <BrandLogo variant={collapsed ? "mark" : "full"} className={collapsed ? undefined : "w-full"} />
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          aria-expanded={!collapsed}
          className={cn(
            "flex items-center justify-center rounded-md border border-sidebar-border text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-8 h-8 shrink-0",
            !collapsed && "absolute top-3 end-2",
          )}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5", collapsed ? "px-2" : "px-3")}>
        {sections.map((s) => (
          <div key={s.label}>
            {!collapsed && (
              <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {s.items.map((it) => (
                <li key={it.to}>{renderNavItem(it)}</li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border shrink-0 flex items-center",
          collapsed ? "p-2 justify-center" : "p-3 gap-2.5",
        )}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
          {currentUser.initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{currentUser.name}</div>
            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${roleBadgeClass(currentUser.role)}`}>
              {t(`roles.${currentUser.role}`)}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
