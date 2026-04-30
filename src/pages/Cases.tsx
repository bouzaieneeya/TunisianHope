import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cases as allCases } from "@/lib/mockData";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { CaseStatusBadge, RiskBadge } from "@/components/shared/Badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function Cases() {
  const navigate = useNavigate();
  const { currentUser, failure } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [counselor, setCounselor] = useState("all");

  const cases = useMemo(() => {
    return allCases.map((c) => {
      if (failure === "S2_MALFORMED" && c.id === "C-1054") return { ...c, status: "Flagged" as const, flagReason: "Data error" };
      if (failure === "S2_MISSED_CASCADE" && ["C-1042","C-1048","C-1049"].includes(c.id)) return { ...c, status: "Active Follow-up" as const, riskLevel: "High" as const };
      return c;
    });
  }, [failure]);

  const filtered = cases.filter((c) =>
    (q === "" || c.id.toLowerCase().includes(q.toLowerCase()) || c.initials.toLowerCase().includes(q.toLowerCase())) &&
    (status === "all" || c.status === status) &&
    (risk === "all" || c.riskLevel === risk) &&
    (counselor === "all" || c.counselor === counselor)
  );

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search case ID or initials" className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["New","In Assessment","Active Follow-up","Referred","Closed","Flagged"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {["Low","Moderate","High","Critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={counselor} onValueChange={setCounselor}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Counselor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counselors</SelectItem>
              <SelectItem value="Sara M.">Sara M.</SelectItem>
              <SelectItem value="Amine T.">Amine T.</SelectItem>
            </SelectContent>
          </Select>
          {(currentUser.role === "Operator" || currentUser.role === "Admin") && (
            <button onClick={() => toast.success("New case created (demo)")} className="ml-auto h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Case
            </button>
          )}
        </div>
      </Panel>

      <div className="panel overflow-hidden">
        {filtered.length === 0 ? <EmptyState message="No cases match the current filters." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Case ID","Patient","Age","Intake","Status","Risk","Counselor","Last Activity",""].map(h => (
                    <th key={h} className="text-left font-medium px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)} className="hover:bg-muted/40 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.initials}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.age}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.intakeDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <CaseStatusBadge status={c.status} />
                        {c.flagReason && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />{c.flagReason}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={c.riskLevel} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{c.counselor}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.lastActivity}</td>
                    <td className="px-4 py-3 text-right text-primary text-xs">View →</td>
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
