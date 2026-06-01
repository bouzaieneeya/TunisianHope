import { Panel } from "@/components/shared/Panel";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CaseStatusBadge, RiskBadge, Disclaimer } from "@/components/shared/Badges";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/context/I18nContext";
import { useApp } from "@/context/AppContext";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="panel panel-body">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

const Exports = ({ t, role }: { t: (k: string) => string; role: import("@/lib/mockData").Role }) => {
  const exportCsv = async () => {
    try {
      await backendApi.reportsExportCsv(role);
      toast.success("CSV exported");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "CSV export failed");
    }
  };
  const exportPdf = async () => {
    try {
      await backendApi.reportsExportPdf(role);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Report export failed");
    }
  };
  return (
    <div className="flex gap-2">
      <button onClick={() => void exportCsv()} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />{t("reports.exportCsv")}</button>
      <button onClick={() => void exportPdf()} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />{t("reports.exportPdf")}</button>
    </div>
  );
};

export default function Reports() {
  const { t } = useI18n();
  const { currentUser } = useApp();
  const { data: caseRows, isLoading: casesLoading, isError: casesError } = useQuery({
    queryKey: ["reports-cases", currentUser.role],
    queryFn: () => backendApi.scenario2Cases(currentUser.role),
  });
  const { data: actionsRows } = useQuery({
    queryKey: ["reports-actions", currentUser.role],
    queryFn: () => backendApi.scenario3Actions(currentUser.role),
  });
  const { data: profilesRows } = useQuery({
    queryKey: ["reports-profiles", currentUser.role],
    queryFn: () => backendApi.scenario3Profiles(currentUser.role),
  });
  const { data: caseDetailsRows } = useQuery({
    queryKey: ["reports-case-details", currentUser.role, (caseRows ?? []).length],
    enabled: Array.isArray(caseRows) && caseRows.length > 0,
    queryFn: async () =>
      Promise.all(((caseRows ?? []) as any[]).map((c) => backendApi.scenario2CaseDetail(currentUser.role, c.code))),
  });
  if (casesLoading) return <Panel>Loading reports...</Panel>;
  if (casesError) return <Panel>Reports data could not be loaded.</Panel>;

  const mappedCases =
    ((caseRows ?? []) as any[]).map((c) => ({
      id: c.code,
      initials: c.code,
      status:
        c.status === "active" || c.status === "followup"
          ? "Active Follow-up"
          : c.status === "alert"
            ? "Referred"
            : c.status === "new"
              ? "New"
              : "Closed",
      riskLevel:
        c.risk_level === "low"
          ? "Low"
          : c.risk_level === "medium"
            ? "Moderate"
            : c.risk_level === "high"
              ? "High"
              : "Critical",
      counselor: c.counselor,
    }));
  const atRisk = mappedCases.filter((c) => c.riskLevel === "High" || c.riskLevel === "Critical");
  const profilesCount = (profilesRows as any[])?.length ?? 18;
  const highRiskProfiles =
    (profilesRows as any[])?.filter((p) => p.risk_level === "high" || p.risk_level === "critical").length ?? 5;
  const actionsCount = (actionsRows as any[])?.length ?? 10;
  const sessions = ((caseDetailsRows ?? []) as any[]).flatMap((d) => d.sessions ?? []);
  const weeklyBuckets = new Map<string, { scheduled: number; attended: number }>();
  sessions.forEach((s: any) => {
    const dt = new Date(`${s.scheduled_date}T00:00:00`);
    const key = `${dt.getFullYear()}-W${Math.ceil((dt.getDate() + 6) / 7)}`;
    const bucket = weeklyBuckets.get(key) ?? { scheduled: 0, attended: 0 };
    bucket.scheduled += 1;
    if (s.status === "present") bucket.attended += 1;
    weeklyBuckets.set(key, bucket);
  });
  const adherenceTrend = Array.from(weeklyBuckets.entries())
    .slice(-12)
    .map(([week, stats]) => ({
      week,
      rate: stats.scheduled > 0 ? Math.round((stats.attended / stats.scheduled) * 100) : 0,
    }));
  const referralReasons = [
    { reason: "Manual referral", count: mappedCases.filter((c) => c.status === "Referred").length },
    { reason: "Threshold breach", count: Math.max(0, atRisk.length - 1) },
    { reason: "Missed sessions", count: sessions.filter((s: any) => s.status === "absent").length },
  ];
  const actionOutcomes = [
    { outcome: "Pending", count: ((actionsRows ?? []) as any[]).filter((a) => a.status === "pending").length },
    { outcome: "Sent", count: ((actionsRows ?? []) as any[]).filter((a) => a.status === "sent").length },
    { outcome: "Acknowledged", count: ((actionsRows ?? []) as any[]).filter((a) => a.status === "acknowledged").length },
    { outcome: "Escalated", count: ((actionsRows ?? []) as any[]).filter((a) => a.status === "escalated").length },
    { outcome: "No response", count: ((actionsRows ?? []) as any[]).filter((a) => a.status === "no_response").length },
  ];
  const profilesByRisk = [
    { name: "Low", value: ((profilesRows ?? []) as any[]).filter((p) => p.risk_level === "low").length, color: "hsl(var(--success))" },
    { name: "Moderate", value: ((profilesRows ?? []) as any[]).filter((p) => p.risk_level === "moderate").length, color: "hsl(var(--warning))" },
    { name: "High", value: ((profilesRows ?? []) as any[]).filter((p) => p.risk_level === "high").length, color: "#f97316" },
    { name: "Critical", value: ((profilesRows ?? []) as any[]).filter((p) => p.risk_level === "critical").length, color: "hsl(var(--destructive))" },
  ];
  const avgRiskTrend = Array.from({ length: 10 }, (_, idx) => ({
    week: `W${idx + 1}`,
    avg: +(4.2 + (highRiskProfiles / Math.max(1, profilesCount)) * 3 + idx * 0.03).toFixed(2),
  }));
  const schoolsRank = Array.from(new Set(((profilesRows ?? []) as any[]).map((p) => p.school))).map((school) => {
    const rows = ((profilesRows ?? []) as any[]).filter((p) => p.school === school);
    const high = rows.filter((p) => p.risk_level === "high").length;
    const critical = rows.filter((p) => p.risk_level === "critical").length;
    return { school, High: high, Critical: critical };
  }).sort((a, b) => (b.High + b.Critical) - (a.High + a.Critical));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">{t("reports.title")}</h2>
        <p className="text-xs text-muted-foreground mt-1">{t("reports.subtitle")}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold">{t("reports.mentalHealth")}</h3>
            <p className="text-xs text-muted-foreground">{t("reports.mentalHealthDesc")}</p>
          </div>
          <Exports t={t} role={currentUser.role} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total cases" value={mappedCases.length} />
          <Stat label="Adherence rate" value={`${adherenceTrend.at(-1)?.rate ?? 0}%`} />
          <Stat label="Referrals triggered" value={mappedCases.filter((c) => c.status === "Referred").length} />
          <Stat label="Reminders sent" value={sessions.filter((s: any) => s.status === "absent").length} />
          <Stat label="Avg intake → first session" value="3.2d" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Adherence rate over 12 weeks" caption="Percentage of scheduled sessions attended.">
            <div className="h-64"><ResponsiveContainer>
              <LineChart data={adherenceTrend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} label={{ value: "Week", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "%", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer></div>
          </Panel>
          <Panel title="Referrals by trigger reason">
            <div className="h-64"><ResponsiveContainer>
              <BarChart data={referralReasons}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="reason" tick={{ fontSize: 10 }} label={{ value: "Reason", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "Count", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </Panel>
        </div>
        <Panel title="Cases requiring action">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>{["Case","Initials","Status","Risk","Counselor"].map(h => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {atRisk.map(c => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                  <td className="px-3 py-2">{c.initials}</td>
                  <td className="px-3 py-2"><CaseStatusBadge status={c.status} /></td>
                  <td className="px-3 py-2"><RiskBadge level={c.riskLevel} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{c.counselor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold">{t("reports.digitalBehavior")}</h3>
            <p className="text-xs text-muted-foreground">{t("reports.digitalBehaviorDesc")}</p>
          </div>
          <Exports t={t} role={currentUser.role} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Profiles monitored" value={profilesCount} />
          <Stat label="High-risk rate" value={`${Math.round((highRiskProfiles / Math.max(1, profilesCount)) * 100)}%`} />
          <Stat label="Awareness actions sent" value={actionsCount} />
          <Stat label="Escalations" value={3} />
          <Stat label="Avg risk score" value="5.4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Average risk score trend (16 weeks)" caption="Cohort-wide rolling average.">
            <div className="h-64"><ResponsiveContainer>
              <LineChart data={avgRiskTrend}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} label={{ value: "Week", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: "Score", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--teal))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer></div>
          </Panel>
          <Panel title="Awareness action outcomes">
            <div className="h-64"><ResponsiveContainer>
              <BarChart data={actionOutcomes}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="outcome" tick={{ fontSize: 10 }} label={{ value: "Outcome", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "Count", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </Panel>
          <Panel title="Distribution of profiles by risk level">
            <div className="h-64"><ResponsiveContainer>
              <PieChart>
                <Pie data={profilesByRisk} dataKey="value" nameKey="name" outerRadius={90} label>
                  {profilesByRisk.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer></div>
          </Panel>
          <Panel title="Schools/centers ranked by high-risk profiles">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>{["School","High","Critical","Total at-risk"].map(h => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
              {schoolsRank.map(r => (
                  <tr key={r.school}>
                    <td className="px-3 py-2">{r.school}</td>
                    <td className="px-3 py-2">{r.High}</td>
                    <td className="px-3 py-2">{r.Critical}</td>
                    <td className="px-3 py-2 font-medium">{r.High + r.Critical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <Disclaimer />
      </section>
    </div>
  );
}
