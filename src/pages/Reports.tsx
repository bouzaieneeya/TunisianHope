import { Panel } from "@/components/shared/Panel";
import { adherenceTrend, referralReasons, avgRiskTrend, actionOutcomes, profilesByRisk, cases, heatmap } from "@/lib/mockData";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CaseStatusBadge, RiskBadge, Disclaimer } from "@/components/shared/Badges";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="panel panel-body">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value">{value}</div>
  </div>
);

const Exports = () => (
  <div className="flex gap-2">
    <button onClick={() => toast.success("CSV exported")} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Export CSV</button>
    <button onClick={() => toast.success("PDF exported")} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Export PDF</button>
  </div>
);

export default function Reports() {
  const atRisk = cases.filter(c => c.riskLevel === "High" || c.riskLevel === "Critical");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">Scenario 2 — Mental health follow-up</h2>
            <p className="text-xs text-muted-foreground">Adherence, referrals, and case outcomes.</p>
          </div>
          <Exports />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total cases" value={cases.length} />
          <Stat label="Adherence rate" value="78%" />
          <Stat label="Referrals triggered" value={6} />
          <Stat label="Reminders sent" value={14} />
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
            <h2 className="text-lg font-semibold">Scenario 3 — Digital behavior support</h2>
            <p className="text-xs text-muted-foreground">Risk trends, awareness outcomes, school distribution.</p>
          </div>
          <Exports />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Profiles monitored" value={18} />
          <Stat label="High-risk rate" value="28%" />
          <Stat label="Awareness actions sent" value={10} />
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
                {[...heatmap].sort((a,b) => (b.High+b.Critical) - (a.High+a.Critical)).map(r => (
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
