import { useMemo, useState } from "react";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { auditLog } from "@/lib/mockData";
import { useApp } from "@/context/AppContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function AuditLog() {
  const { failure } = useApp();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [scenario, setScenario] = useState("all");
  const [result, setResult] = useState("all");

  const extra = useMemo(() => {
    const ts = new Date().toLocaleString();
    if (failure === "S2_UNAUTHORIZED") return [{ id: "L-X1", timestamp: ts, user: "operator_nour", role: "Operator" as const, action: "Trigger referral", affectedId: "C-1042", scenario: "S2" as const, result: "Blocked" as const, blockReason: "Operator role cannot trigger referrals" }];
    if (failure === "S3_UNAUTHORIZED") return [{ id: "L-X2", timestamp: ts, user: "operator_nour", role: "Operator" as const, action: "Send awareness action", affectedId: "Y-3001", scenario: "S3" as const, result: "Blocked" as const, blockReason: "Only counselors can send awareness actions" }];
    if (failure === "S2_MALFORMED") return [{ id: "L-X3", timestamp: ts, user: "system", role: "Admin" as const, action: "Intake validation", affectedId: "C-1054", scenario: "S2" as const, result: "Blocked" as const, blockReason: "Malformed intake — required fields missing" }];
    if (failure === "S3_ASSESSMENT_CONFLICT") return [{ id: "L-X4", timestamp: ts, user: "system", role: "Admin" as const, action: "Assessment ingest", affectedId: "Y-3007", scenario: "S3" as const, result: "Blocked" as const, blockReason: "Duplicate submission within 24h" }];
    if (failure === "S2_MISSED_CASCADE") return [{ id: "L-X5", timestamp: ts, user: "system", role: "Admin" as const, action: "Auto-escalation cascade", affectedId: "C-1042,C-1048,C-1049", scenario: "S2" as const, result: "Success" as const }];
    return [];
  }, [failure]);

  const rows = [...extra, ...auditLog].filter(r =>
    (q === "" || r.affectedId.toLowerCase().includes(q.toLowerCase()) || r.action.toLowerCase().includes(q.toLowerCase()) || r.user.toLowerCase().includes(q.toLowerCase())) &&
    (role === "all" || r.role === role) &&
    (scenario === "all" || r.scenario === scenario) &&
    (result === "all" || r.result === result)
  );

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, user, or affected ID" className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Select value={role} onValueChange={setRole}><SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent>
            <SelectItem value="all">All roles</SelectItem><SelectItem value="Operator">Operator</SelectItem><SelectItem value="Counselor">Counselor</SelectItem><SelectItem value="Admin">Admin</SelectItem>
          </SelectContent></Select>
          <Select value={scenario} onValueChange={setScenario}><SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Scenario" /></SelectTrigger><SelectContent>
            <SelectItem value="all">All scenarios</SelectItem><SelectItem value="S2">S2</SelectItem><SelectItem value="S3">S3</SelectItem>
          </SelectContent></Select>
          <Select value={result} onValueChange={setResult}><SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Result" /></SelectTrigger><SelectContent>
            <SelectItem value="all">All results</SelectItem><SelectItem value="Success">Success</SelectItem><SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent></Select>
        </div>
      </Panel>

      <div className="panel overflow-hidden">
        {rows.length === 0 ? <EmptyState message="No audit entries match." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>{["Timestamp","User","Role","Action","Affected","Scenario","Result","Block reason"].map(h => <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(r => (
                  <tr key={r.id} className={r.result === "Blocked" ? "bg-destructive/5" : ""}>
                    <td className="px-3 py-2 text-xs">{r.timestamp}</td>
                    <td className="px-3 py-2">{r.user}</td>
                    <td className="px-3 py-2">{r.role}</td>
                    <td className="px-3 py-2">{r.action}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.affectedId}</td>
                    <td className="px-3 py-2">{r.scenario}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${r.result === "Blocked" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success"}`}>{r.result}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.blockReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
