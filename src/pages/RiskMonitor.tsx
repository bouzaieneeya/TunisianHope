import { Panel } from "@/components/shared/Panel";
import { weeklyHighRisk, indicatorBreakdown, heatmap, youthProfiles } from "@/lib/mockData";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { YouthRiskBadge } from "@/components/shared/Badges";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

function KPI({ label, value, tone }: { label: string; value: any; tone?: "danger" | "warning" | "muted" }) {
  const cls = tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning" : tone === "muted" ? "text-muted-foreground" : "";
  return <div className="panel panel-body"><div className="kpi-label">{label}</div><div className={`kpi-value ${cls}`}>{value}</div></div>;
}

const cellColor = (n: number) => {
  if (n === 0) return "bg-muted/30";
  if (n <= 1) return "bg-success/20";
  if (n <= 3) return "bg-warning/30";
  if (n <= 5) return "bg-warning/50";
  return "bg-destructive/40";
};

export default function RiskMonitor() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const flagged = youthProfiles.filter(y => y.riskLevel === "High" || y.riskLevel === "Critical").slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Profiles assessed this month" value={42} />
        <KPI label="New high-risk this week" value={5} tone="danger" />
        <KPI label="Pending follow-up" value={7} tone="warning" />
        <KPI label="No assessment > 30 days" value={3} tone="muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Weekly high-risk profile count — last 16 weeks" caption="Profiles crossing the high-risk threshold trigger automatic counselor assignment.">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={weeklyHighRisk}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Week", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Profiles", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="HighRisk" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Risk indicator breakdown across all profiles" caption="Average score per dimension across full cohort (0–10).">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={indicatorBreakdown}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dim" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Indicator", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} label={{ value: "Avg score", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="avg" fill="hsl(var(--teal))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Risk heatmap — by school/center" caption="Click a cell to filter the youth profiles list.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">School / Center</th>
                {["Low","Moderate","High","Critical"].map(h => <th key={h} className="text-center px-3 py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {heatmap.map(row => (
                <tr key={row.school} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{row.school}</td>
                  {(["Low","Moderate","High","Critical"] as const).map(lvl => (
                    <td key={lvl} className="px-3 py-2 text-center">
                      <button
                        onClick={() => navigate(`/youth-profiles?school=${encodeURIComponent(row.school)}&risk=${lvl}`)}
                        className={`w-12 h-9 rounded ${cellColor(row[lvl])} font-medium hover:ring-2 hover:ring-ring`}
                      >
                        {row[lvl]}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Flagged profiles needing action">
        <ul className="divide-y divide-border -mx-1">
          {flagged.map(y => (
            <li key={y.id} className="px-1 py-3 flex items-center gap-3">
              <span className="font-mono text-sm">{y.id}</span>
              <YouthRiskBadge level={y.riskLevel} />
              <span className="text-xs text-muted-foreground flex-1">Top indicator: Screen time excess · Last contact 5 days ago</span>
              {currentUser.role === "Admin"
                ? <button onClick={() => toast.success("Counselor assigned")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Assign counselor</button>
                : <button onClick={() => navigate(`/youth-profiles/${y.id}`)} className="text-xs px-2 py-1 border border-primary/30 bg-primary/5 text-primary rounded hover:bg-primary/10">Review now</button>
              }
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
