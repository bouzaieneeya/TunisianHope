import { useEffect, useState } from "react";
import { Bell, PanelLeft, PanelLeftClose, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import BrandLogo from "@/components/shared/BrandLogo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";



const routeTitleKeys: Record<string, string> = {

  dashboard: "nav.dashboard",

  cases: "nav.mentalHealthCases",

  appointments: "nav.appointments",

  alerts: "nav.alerts",

  "youth-profiles": "nav.youthProfiles",

  "risk-monitor": "nav.riskMonitor",

  "awareness-actions": "nav.awarenessActions",

  reports: "nav.reports",

  "audit-log": "nav.auditLog",

  settings: "nav.settings",

  "users-management": "Users Management",

};



type TopbarProps = {

  sidebarCollapsed: boolean;

  onSidebarToggle: () => void;

};



export default function Topbar({ sidebarCollapsed, onSidebarToggle }: TopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useApp();
  const { t } = useI18n();
  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(searchQ.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQ]);

  const segment = pathname.split("/")[1] || "dashboard";

  const titleKey = routeTitleKeys[segment];

  const title = titleKey?.includes(".") ? t(titleKey) : (titleKey ?? t("app.name"));



  const { data: alerts } = useQuery({

    queryKey: ["topbar-alerts", currentUser.role],

    queryFn: () => backendApi.scenario2Alerts(currentUser.role),

    enabled: isAuthenticated,

    refetchInterval: 60_000,

  });



  const activeAlerts = ((alerts ?? []) as any[]).filter((a) => !a.is_resolved);

  const notificationCount = activeAlerts.length;

  const { data: searchResults } = useQuery({
    queryKey: ["global-search", currentUser.role, debouncedQ],
    queryFn: () => backendApi.globalSearch(currentUser.role, debouncedQ),
    enabled: isAuthenticated && debouncedQ.length >= 2,
  });
  const caseHits = (searchResults?.cases ?? []) as { code: string; label: string }[];
  const profileHits = (searchResults?.profiles ?? []) as { code: string; label: string }[];
  const hasSearchHits = caseHits.length > 0 || profileHits.length > 0;

  return (

    <header className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20">

      <BrandLogo variant="mark" className="md:hidden h-9 w-9" />

      <button

        type="button"

        onClick={onSidebarToggle}

        aria-label={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}

        aria-expanded={!sidebarCollapsed}

        className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"

      >

        {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}

      </button>

      {sidebarCollapsed && <BrandLogo variant="mark" className="hidden md:inline-flex h-9 w-9" />}

      <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>



      <div className="flex-1 max-w-md ms-4 hidden sm:block">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder={t("topbar.searchPlaceholder")}
                className="w-full h-9 ps-9 pe-3 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            {debouncedQ.length < 2 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground">Type at least 2 characters…</p>
            ) : !hasSearchHits ? (
              <p className="px-3 py-4 text-xs text-muted-foreground">No cases or youth profiles found.</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto divide-y divide-border py-1">
                {caseHits.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      className="w-full text-start px-3 py-2 text-xs hover:bg-muted/60"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQ("");
                        navigate(`/cases/${c.code}`);
                      }}
                    >
                      <span className="font-mono font-medium">{c.code}</span>
                      <span className="text-muted-foreground ms-2">{c.label.replace(`${c.code} — `, "")}</span>
                    </button>
                  </li>
                ))}
                {profileHits.map((p) => (
                  <li key={p.code}>
                    <button
                      type="button"
                      className="w-full text-start px-3 py-2 text-xs hover:bg-muted/60"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQ("");
                        navigate(`/youth-profiles/${p.code}`);
                      }}
                    >
                      <span className="font-mono font-medium">{p.code}</span>
                      <span className="text-muted-foreground ms-2">{p.label.replace(`${p.code} — `, "")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>



      <div className="ms-auto flex items-center gap-2">

        <LanguageSwitcher compact />



        <Popover>

          <PopoverTrigger asChild>

            <button

              type="button"

              aria-label={t("topbar.notifications")}

              className="relative h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted"

            >

              <Bell className="w-4 h-4 text-muted-foreground" />

              {notificationCount > 0 && (

                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] text-[10px] font-semibold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center px-1">

                  {notificationCount > 9 ? "9+" : notificationCount}

                </span>

              )}

            </button>

          </PopoverTrigger>

          <PopoverContent align="end" className="w-80 p-0">

            <div className="px-3 py-2.5 border-b border-border">

              <p className="text-sm font-medium">{t("topbar.notifications")}</p>

              <p className="text-xs text-muted-foreground">

                {notificationCount > 0

                  ? `${notificationCount} active alert${notificationCount === 1 ? "" : "s"}`

                  : t("topbar.notificationsEmpty")}

              </p>

            </div>

            <ul className="max-h-72 overflow-y-auto divide-y divide-border">

              {activeAlerts.length === 0 ? (

                <li className="px-3 py-6 text-center text-xs text-muted-foreground">

                  {t("topbar.notificationsNone")}

                </li>

              ) : (

                activeAlerts.slice(0, 8).map((alert: any) => (

                  <li key={alert.id}>

                    <Link

                      to={`/cases/${alert.case_code}`}

                      className="block px-3 py-2.5 hover:bg-muted/60 transition-colors"

                    >

                      <div className="flex items-center justify-between gap-2">

                        <span className="text-xs font-mono font-medium">{alert.case_code}</span>

                        <span className="text-[10px] text-muted-foreground">

                          {new Date(alert.created_at).toLocaleDateString()}

                        </span>

                      </div>

                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.explanation}</p>

                    </Link>

                  </li>

                ))

              )}

            </ul>

            {activeAlerts.length > 0 && (

              <div className="px-3 py-2 border-t border-border">

                <Link to="/alerts" className="text-xs text-primary hover:underline">

                  {t("topbar.viewAllAlerts")}

                </Link>

              </div>

            )}

          </PopoverContent>

        </Popover>



        <button

          onClick={() => void logout()}

          className="h-9 px-3 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted"

        >

          Logout

        </button>

      </div>

    </header>

  );

}


