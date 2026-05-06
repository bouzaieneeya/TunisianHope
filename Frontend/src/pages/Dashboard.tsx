import { Panel } from "@/components/shared/Panel";
import { adherenceWeeks, riskDistribution, alerts, appointments, cases, youthProfiles, awarenessActions } from "@/lib/mockData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import { TrendingUp, TrendingDown, Bell } from "lucide-react";
import { AlertStatusBadge, AlertTypeBadge, AppointmentStatusBadge } from "@/components/shared/Badges";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

function KPI({ label, value, sub, tone, group }: { label: string; value: string | number; sub?: string; tone?: "danger" | "warning" | "teal"; group: "S2" | "S3" }) {
  const toneCls =
    tone === "danger" ? "text-destructive" :
    tone === "warning" ? "text-warning" :
    tone === "teal" ? "text-teal" : "text-foreground";
  return (
    <div className="panel panel-body">
      <div className="flex items-center justify-between">
        <div className="kpi-label">{label}</div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${group === "S2" ? "border-primary/20 text-primary bg-primary/5" : "border-teal/30 text-teal bg-teal/5"}`}>{group}</span>
      </div>
      <div className={`kpi-value ${toneCls}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useApp();
  const activeCases = cases.filter((c) => c.status !== "Closed").length;
  const referralsPending = cases.filter((c) => c.status === "Referred").length;
  const highRiskYouth = youthProfiles.filter((y) => y.riskLevel === "High" || y.riskLevel === "Critical").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPI group="S2" label="Active mental health cases" value={activeCases} sub={<><TrendingUp className="inline w-3 h-3 text-success" /> +2 this week</> as any} />
        <KPI group="S2" label="Appointments this week" value={24} sub="3 missed" tone="warning" />
        <KPI group="S2" label="Referrals pending" value={referralsPending} tone={referralsPending > 0 ? "danger" : undefined} />
        <KPI group="S3" label="Youth profiles monitored" value={youthProfiles.length} />
        <KPI group="S3" label="High digital-risk profiles" value={highRiskYouth} tone="danger" />
        <KPI group="S3" label="Awareness actions sent (week)" value={awarenessActions.filter(a => a.status !== "Pending").length} tone="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Appointment adherence — last 12 weeks" caption="Weeks where attended < scheduled trigger automatic reminders.">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={adherenceWeeks}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Week", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Count", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Scheduled" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Attended" stroke="hsl(var(--teal))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Digital risk level distribution" caption="Risk level computed from 5 behavioral indicators.">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={riskDistribution}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Risk level", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Profiles", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistribution.map((d) => <Cell key={d.level} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Active alerts">
          <ul className="divide-y divide-border -mx-1">
            {alerts.slice(0, 6).map((a) => (
              <li key={a.id} className="px-1 py-3 flex items-start gap-3">
                <Bell className={`w-4 h-4 mt-0.5 ${a.severity === "Critical" ? "text-destructive" : a.severity === "High" ? "text-warning" : "text-info"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{a.subjectId}</span>
                    <AlertTypeBadge type={a.type} />
                    <AlertStatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.rule}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.triggeredAt}</p>
                </div>
                {currentUser.role === "Counselor" && a.status === "New" && (
                  <button onClick={() => toast.success(`Alert ${a.id} acknowledged`)} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">
                    Acknowledge
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Upcoming appointments">
          <ul className="divide-y divide-border -mx-1">
            {appointments.slice(0, 6).map((ap) => (
              <li key={ap.id} className="px-1 py-3 flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-24">{new Date(ap.date).toLocaleDateString()} <br /> {new Date(ap.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{ap.patientInitials} <span className="text-muted-foreground font-normal">({ap.caseId})</span></div>
                  <div className="text-xs text-muted-foreground">{ap.counselor} · {ap.type}</div>
                </div>
                <AppointmentStatusBadge status={ap.status} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
