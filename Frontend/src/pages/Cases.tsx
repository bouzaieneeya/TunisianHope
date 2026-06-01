import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { CaseStatusBadge, RiskBadge } from "@/components/shared/Badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

export default function Cases() {
  const navigate = useNavigate();
  const { currentUser, failure } = useApp();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newAge, setNewAge] = useState("16");
  const [newRegion, setNewRegion] = useState("Tunis");
  const [newCenter, setNewCenter] = useState("Centre El Manar");
  const [creating, setCreating] = useState(false);
  const { data: apiCases, isLoading, isError, error } = useQuery({
    queryKey: ["scenario2-cases", currentUser.role],
    queryFn: () => backendApi.scenario2Cases(currentUser.role),
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [counselor, setCounselor] = useState("all");

  const createCase = async () => {
    setCreating(true);
    try {
      const created = await backendApi.scenario2CreateCase(currentUser.role, {
        age: Number(newAge),
        region: newRegion.trim(),
        school_or_center: newCenter.trim(),
        initial_score: 40,
        risk_level: "medium",
      });
      await queryClient.invalidateQueries({ queryKey: ["scenario2-cases", currentUser.role] });
      setCreateOpen(false);
      toast.success(`Case ${created.code} created`);
      navigate(`/cases/${created.code}`);
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Could not create case";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.errors?.length) msg = parsed.errors.join("; ");
        else if (parsed.detail) msg = parsed.detail;
      } catch {
        /* keep raw message */
      }
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const source = (apiCases ?? []).map((c: any) => ({
    id: c.code,
    initials: c.code.split("-")[1],
    age: c.age,
    intakeDate: c.intake_date,
    status:
      c.status === "new"
        ? "New"
        : c.status === "in_review"
          ? "In Assessment"
          : c.status === "active"
            ? "Active Follow-up"
            : c.status === "followup"
              ? "Active Follow-up"
              : c.status === "alert"
                ? "Referred"
                : c.status === "closed"
                  ? "Closed"
                  : "Flagged",
    riskLevel:
      c.risk_level === "low"
        ? "Low"
        : c.risk_level === "medium"
          ? "Moderate"
          : c.risk_level === "high"
            ? "High"
            : "Critical",
    counselor: c.counselor ?? "Unassigned",
    lastActivity: c.last_activity ? new Date(c.last_activity).toLocaleString() : "N/A",
  }));

  const cases = useMemo(() => {
    return source.map((c) => {
      if (failure === "S2_MALFORMED" && c.id === "C-1054") return { ...c, status: "Flagged" as const, flagReason: t("cases.dataError") };
      if (failure === "S2_MISSED_CASCADE" && ["C-1042","C-1048","C-1049"].includes(c.id)) return { ...c, status: "Active Follow-up" as const, riskLevel: "High" as const };
      return c;
    });
  }, [failure, source, t]);

  if (isLoading) return <Panel>Loading cases...</Panel>;
  if (isError) return <Panel>{error instanceof Error ? error.message : "Cases could not be loaded."}</Panel>;

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
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cases.searchPlaceholder")} className="w-full h-9 ps-9 pe-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cases.allStatuses")}</SelectItem>
              {["New","In Assessment","Active Follow-up","Referred","Closed","Flagged"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cases.allRisk")}</SelectItem>
              {["Low","Moderate","High","Critical"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={counselor} onValueChange={setCounselor}>
            <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Counselor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cases.allCounselors")}</SelectItem>
              <SelectItem value="Sara M.">Sara M.</SelectItem>
              <SelectItem value="Amine T.">Amine T.</SelectItem>
            </SelectContent>
          </Select>
          {(currentUser.role === "Operator" || currentUser.role === "Admin") && (
            <button onClick={() => setCreateOpen(true)} className="ml-auto h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> {t("common.newCase")}
            </button>
          )}
        </div>
      </Panel>

      <div className="panel overflow-hidden">
        {filtered.length === 0 ? <EmptyState message={t("common.noResults")} /> : (
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
                    <td className="px-4 py-3 text-end text-primary text-xs">{t("common.view")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.newCase")}</DialogTitle>
            <DialogDescription>Create a new mental health case intake record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input type="number" value={newAge} onChange={(e) => setNewAge(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Age" />
            <input value={newRegion} onChange={(e) => setNewRegion(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Region" />
            <input value={newCenter} onChange={(e) => setNewCenter(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="School / Center" />
          </div>
          <DialogFooter>
            <button onClick={() => void createCase()} disabled={creating} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60">
              {creating ? "Creating..." : "Create case"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
