import { Panel } from "@/components/shared/Panel";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { Bell } from "lucide-react";
import { AlertStatusBadge, AlertTypeBadge, AppointmentStatusBadge } from "@/components/shared/Badges";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { Link } from "react-router-dom";

function KPI({ label, value, sub, tone, domain, domainLabel }: { label: string; value: string | number; sub?: string; tone?: "danger" | "warning" | "teal"; domain?: "followup" | "digital"; domainLabel?: string }) {
  const toneCls =
    tone === "danger" ? "text-destructive" :
    tone === "warning" ? "text-warning" :
    tone === "teal" ? "text-teal" : "text-foreground";
  return (
    <div className="panel panel-body">
      <div className="flex items-center justify-between">
        <div className="kpi-label">{label}</div>
        {domain && domainLabel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${domain === "followup" ? "border-primary/20 text-primary bg-primary/5" : "border-teal/30 text-teal bg-teal/5"}`}>{domainLabel}</span>
        )}
      </div>
      <div className={`kpi-value ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function mapSessionStatus(status: string) {
  if (status === "present") return "Attended";
  if (status === "absent") return "Missed";
  if (status === "cancelled") return "Cancelled";
  return "Confirmed";
}

export default function Dashboard() {
  const { currentUser } = useApp();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = useQuery({
    queryKey: ["scenario2-dashboard", currentUser.role],
    queryFn: () => backendApi.scenario2Dashboard(currentUser.role),
  });
  const {
    data: profiles,
    isError: profilesError,
  } = useQuery({
    queryKey: ["scenario3-profiles", currentUser.role],
    queryFn: () => backendApi.scenario3Profiles(currentUser.role),
  });
  const { data: actions } = useQuery({
    queryKey: ["scenario3-actions", currentUser.role],
    queryFn: () => backendApi.scenario3Actions(currentUser.role),
  });

  const activeCases = data?.active_cases ?? 0;
  const referralsPending = data?.referrals_pending ?? 0;
  const appointmentsThisWeek = data?.appointments_this_week ?? 0;
  const missedSessions = data?.missed_sessions ?? 0;
  const highRiskYouth =
    profiles?.filter((y: any) => y.risk_level === "high" || y.risk_level === "critical").length ?? 0;
  const youthMonitored = profiles?.length ?? 0;

  const backendRiskDistribution = (data?.risk_distribution ?? []).map((item: any) => {
    const normalized = (item.risk_level ?? "").toLowerCase();
    return {
      level:
        normalized === "low" ? "Low" :
        normalized === "medium" ? "Moderate" :
        normalized === "high" ? "High" : "Critical",
      count: item.count ?? 0,
      color:
        normalized === "low" ? "hsl(var(--success))" :
        normalized === "medium" ? "hsl(var(--warning))" :
        normalized === "high" ? "#f97316" : "hsl(var(--destructive))",
    };
  });
  const riskChartData = backendRiskDistribution;

  const adherenceWeeks = (data?.adherence_weeks ?? []).map((w: any) => ({
    week: w.week,
    Scheduled: w.Scheduled,
    Attended: w.Attended,
  }));

  const liveAlerts = (data?.recent_alerts ?? []).map((a: any) => ({
    id: `A-${a.id}`,
    alertPk: a.id as number,
    type: "Mental Health",
    severity: "High",
    subjectId: a.case_code,
    rule: a.explanation,
    triggeredAt: new Date(a.created_at).toLocaleString(),
    counselor: "N/A",
    status: a.is_resolved ? "Acknowledged" : "New",
  }));

  const upcoming = (data?.upcoming_sessions ?? []).map((s: any) => ({
    id: `AP-${s.id}`,
    caseId: s.case_code,
    patientInitials: s.case_code,
    date: `${s.scheduled_date}T09:00:00`,
    type: "Follow-up",
    counselor: s.counselor,
    status: mapSessionStatus(s.status),
  }));

  if (dashboardLoading) return <Panel>Loading dashboard...</Panel>;
  if (dashboardError || profilesError) {
    return <Panel>Dashboard data could not be loaded.</Panel>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("dashboard.intro")}</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI domain="followup" domainLabel={t("common.domainFollowUp")} label={t("dashboard.activeCases")} value={activeCases} />
        <KPI domain="followup" domainLabel={t("common.domainFollowUp")} label={t("dashboard.appointmentsWeek")} value={appointmentsThisWeek} sub={`${missedSessions} missed`} tone="warning" />
        <KPI domain="followup" domainLabel={t("common.domainFollowUp")} label={t("dashboard.referralsPending")} value={referralsPending} tone={referralsPending > 0 ? "danger" : undefined} />
        <KPI domain="digital" domainLabel={t("common.domainDigital")} label={t("dashboard.youthMonitored")} value={youthMonitored} />
        <KPI domain="digital" domainLabel={t("common.domainDigital")} label={t("dashboard.highDigitalRisk")} value={highRiskYouth} tone="danger" />
        <KPI domain="digital" domainLabel={t("common.domainDigital")} label={t("dashboard.awarenessSent")} value={(actions ?? []).filter((a: any) => a.status !== "pending").length} tone="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title={t("dashboard.adherenceTitle")} caption={t("dashboard.adherenceCaption")}>
          <div className="h-72">
            {adherenceWeeks.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No session data yet. Schedule appointments to see adherence.</p>
            ) : (
              <ResponsiveContainer>
                <LineChart data={adherenceWeeks}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Scheduled" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Attended" stroke="hsl(var(--teal))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title={t("dashboard.riskDistTitle")} caption={t("dashboard.riskDistCaption")}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={riskChartData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskChartData.map((d) => <Cell key={d.level} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title={t("dashboard.activeAlerts")}>
          <ul className="divide-y divide-border -mx-1">
            {liveAlerts.length === 0 ? (
              <li className="px-1 py-4 text-sm text-muted-foreground">No active alerts.</li>
            ) : (
              liveAlerts.slice(0, 6).map((a) => (
                <li key={a.id} className="px-1 py-3 flex items-start gap-3">
                  <Bell className="w-4 h-4 mt-0.5 text-warning" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{a.subjectId}</span>
                      <AlertTypeBadge type={a.type} />
                      <AlertStatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.rule}</p>
                  </div>
                  {currentUser.role === "Counselor" && a.status === "New" && (
                    <button
                      onClick={async () => {
                        try {
                          await backendApi.scenario2UpdateAlert(currentUser.role, a.alertPk, "acknowledge");
                          await queryClient.invalidateQueries({ queryKey: ["scenario2-dashboard", currentUser.role] });
                          toast.success(`Alert ${a.id} acknowledged`);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not acknowledge alert");
                        }
                      }}
                      className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                    >
                      {t("common.acknowledge")}
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel title={t("dashboard.upcomingAppointments")}>
          <ul className="divide-y divide-border -mx-1">
            {upcoming.length === 0 ? (
              <li className="px-1 py-4 text-sm text-muted-foreground">No upcoming sessions.</li>
            ) : (
              upcoming.map((ap) => (
                <li key={ap.id} className="px-1 py-3 flex items-center gap-3">
                  <div className="text-xs text-muted-foreground w-24">
                    {new Date(ap.date).toLocaleDateString()}
                  </div>
                  <div className="flex-1">
                    <Link to={`/cases/${ap.caseId}`} className="text-sm font-medium hover:underline">
                      {ap.caseId}
                    </Link>
                    <div className="text-xs text-muted-foreground">{ap.counselor} · {ap.type}</div>
                  </div>
                  <AppointmentStatusBadge status={ap.status} />
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
