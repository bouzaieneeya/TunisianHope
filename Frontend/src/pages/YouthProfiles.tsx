import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { YouthRiskBadge } from "@/components/shared/Badges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

export default function YouthProfiles() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [ageGroup, setAgeGroup] = useState("15-17");
  const [newSchool, setNewSchool] = useState("Lycee Carthage");
  const [newCounselor, setNewCounselor] = useState("Sara M.");
  const [creating, setCreating] = useState(false);
  const {
    data: liveProfiles,
    isLoading: isProfilesLoading,
    isError: isProfilesError,
    error: profilesError,
  } = useQuery({
    queryKey: ["scenario3-profiles", currentUser.role],
    queryFn: () => backendApi.scenario3Profiles(currentUser.role),
  });
  const [params] = useSearchParams();
  const [risk, setRisk] = useState(params.get("risk") ?? "all");
  const [age, setAge] = useState("all");
  const [school, setSchool] = useState(params.get("school") ?? "all");
  const [status, setStatus] = useState("all");

  const createProfile = async () => {
    setCreating(true);
    try {
      const created = await backendApi.scenario3CreateProfile(currentUser.role, {
        age_group: ageGroup.trim(),
        school: newSchool.trim(),
        counselor: newCounselor.trim(),
        risk_level: "moderate",
      });
      await queryClient.invalidateQueries({ queryKey: ["scenario3-profiles", currentUser.role] });
      setCreateOpen(false);
      toast.success(`Profile ${created.code} created`);
      navigate(`/youth-profiles/${created.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create profile");
    } finally {
      setCreating(false);
    }
  };

  const source = ((liveProfiles ?? []) as any[]).map((y) => ({
    id: y.code,
    ageGroup: y.age_group,
    school: y.school,
    riskLevel:
      y.risk_level === "low"
        ? "Low"
        : y.risk_level === "moderate"
          ? "Moderate"
          : y.risk_level === "high"
            ? "High"
            : "Critical",
    lastAssessment: y.last_assessment_date ?? "N/A",
    counselor: y.counselor,
    status:
      y.status === "active"
        ? "Active"
        : y.status === "pending_review"
          ? "Pending Review"
          : "Closed",
  }));
  const schoolOptions = Array.from(new Set(source.map((y) => y.school)));

  const list = source.filter(y =>
    (risk === "all" || y.riskLevel === risk) &&
    (age === "all" || y.ageGroup === age) &&
    (school === "all" || y.school === school) &&
    (status === "all" || y.status === status)
  );

  return (
    <div className="space-y-4">
      {isProfilesLoading ? <Panel>Loading youth profiles...</Panel> : null}
      {isProfilesError ? <Panel>{profilesError instanceof Error ? profilesError.message : "Youth profiles could not be loaded."}</Panel> : null}
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
              {schoolOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            <button onClick={() => setCreateOpen(true)} className="ml-auto h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Profile</DialogTitle>
            <DialogDescription>Create a youth digital-wellness profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Age group (e.g. 15-17)" />
            <input value={newSchool} onChange={(e) => setNewSchool(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="School / Center" />
            <input value={newCounselor} onChange={(e) => setNewCounselor(e.target.value)} className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Counselor" />
          </div>
          <DialogFooter>
            <button onClick={() => void createProfile()} disabled={creating} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60">
              {creating ? "Creating..." : "Create profile"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
