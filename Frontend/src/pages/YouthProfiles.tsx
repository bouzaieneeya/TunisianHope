import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { youthProfiles } from "@/lib/mockData";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { YouthRiskBadge } from "@/components/shared/Badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function YouthProfiles() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [params] = useSearchParams();
  const [risk, setRisk] = useState(params.get("risk") ?? "all");
  const [age, setAge] = useState("all");
  const [school, setSchool] = useState(params.get("school") ?? "all");
  const [status, setStatus] = useState("all");

  const list = youthProfiles.filter(y =>
    (risk === "all" || y.riskLevel === risk) &&
    (age === "all" || y.ageGroup === age) &&
    (school === "all" || y.school === school) &&
    (status === "all" || y.status === status)
  );

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {["Low","Moderate","High","Critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={age} onValueChange={setAge}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Age" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ages</SelectItem>
              {["12-14","15-17","18-20"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={school} onValueChange={setSchool}>
            <SelectTrigger className="w-48 h-9 text-xs"><SelectValue placeholder="School/center" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All schools/centers</SelectItem>
              {["Lycée Carthage","Centre El Manar","Lycée Bardo","Centre Sousse"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending Review">Pending Review</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          {(currentUser.role === "Operator" || currentUser.role === "Admin") && (
            <button onClick={() => toast.success("New profile created (demo)")} className="ml-auto h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> New Profile
            </button>
          )}
        </div>
      </Panel>

      <div className="panel overflow-hidden">
        {list.length === 0 ? <EmptyState message="No profiles match the filters." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>{["Profile ID","Age","School/Center","Risk","Last Assessment","Counselor","Status",""].map(h => <th key={h} className="text-left font-medium px-4 py-2.5">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map(y => (
                  <tr key={y.id} onClick={() => navigate(`/youth-profiles/${y.id}`)} className="hover:bg-muted/40 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs">{y.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{y.ageGroup}</td>
                    <td className="px-4 py-3">{y.school}</td>
                    <td className="px-4 py-3"><YouthRiskBadge level={y.riskLevel} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{y.lastAssessment}</td>
                    <td className="px-4 py-3 text-muted-foreground">{y.counselor}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{y.status}</td>
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
