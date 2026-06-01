import { useState } from "react";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { ActionStatusBadge, ActionTypeBadge, YouthRiskBadge, Disclaimer } from "@/components/shared/Badges";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

export default function AwarenessActions() {
  const { currentUser, failure } = useApp();
  const queryClient = useQueryClient();
  const {
    data: liveActions,
    isLoading: isActionsLoading,
    isError: isActionsError,
    error: actionsError,
  } = useQuery({
    queryKey: ["scenario3-actions", currentUser.role],
    queryFn: () => backendApi.scenario3Actions(currentUser.role),
  });
  const { data: liveProfiles } = useQuery({
    queryKey: ["scenario3-profiles", currentUser.role],
    queryFn: () => backendApi.scenario3Profiles(currentUser.role),
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [sending, setSending] = useState(false);

  const conflict = failure === "S3_ASSESSMENT_CONFLICT";

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const sendBulk = async (label: string) => {
    if (currentUser.role === "Operator") { setBlocked(true); return; }
    if (label.includes("exported")) {
      toast.success(`${label} — ${selected.length} profile(s)`);
      setSelected([]);
      return;
    }

    const selectedRows = queue.filter((row) => selected.includes(row.id));
    const profilePkByCode = new Map<string, number>(
      ((liveProfiles ?? []) as any[]).map((profile) => [profile.code, profile.id]),
    );
    const profilesWithPk = selectedRows
      .map((row) => ({ row, profilePk: profilePkByCode.get(row.profileId) }))
      .filter((item): item is { row: (typeof selectedRows)[number]; profilePk: number } => Boolean(item.profilePk));

    if (profilesWithPk.length === 0) {
      toast.error("No selected profiles are currently available from backend.");
      return;
    }

    const actionType =
      label.includes("group") ? "informational" :
      label.includes("pack") ? "preventive" :
      "informational";

    setSending(true);
    try {
      await Promise.all(
        profilesWithPk.map(({ row, profilePk }) =>
          backendApi.scenario3SendAction(currentUser.role, {
            profile: profilePk,
            action_type: actionType,
            channel: row.channel === "SMS" ? "sms" : row.channel === "In-person" ? "in_person" : "online",
            counselor: row.counselor,
            rationale: `${label}: ${row.rationale}`,
            status: "pending",
          }),
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ["scenario3-actions", currentUser.role] });
      toast.success(`${label} — ${profilesWithPk.length} profile(s)`);
      setSelected([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send awareness action");
    } finally {
      setSending(false);
    }
  };

  const updateActionStatus = async (actionPk: number, status: string, successMessage: string) => {
    try {
      await backendApi.scenario3UpdateAction(currentUser.role, actionPk, { status });
      await queryClient.invalidateQueries({ queryKey: ["scenario3-actions", currentUser.role] });
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update action");
    }
  };

  const actionRows = (liveActions ?? []).map((a: any) => ({
    id: `AW-${a.id}`,
    actionPk: a.id as number,
    profileId: a.profile_code,
    riskLevel: a.risk_level
      ? a.risk_level.charAt(0).toUpperCase() + a.risk_level.slice(1)
      : "Moderate",
    type: a.action_type === "informational" ? "Informational" : a.action_type === "preventive" ? "Preventive" : "Referral",
    channel: a.channel === "in_person" ? "In-person" : a.channel === "sms" ? "SMS" : "Online",
    counselor: a.counselor,
    status: a.status === "no_response" ? "No response" : a.status.charAt(0).toUpperCase() + a.status.slice(1),
    rationale: a.rationale,
    date: new Date(a.created_at).toISOString().slice(0, 10),
  }));
  const queue = actionRows;

  return (
    <div className="space-y-4">
      {isActionsLoading ? <Panel>Loading awareness actions...</Panel> : null}
      {isActionsError ? <Panel>{actionsError instanceof Error ? actionsError.message : "Awareness actions could not be loaded."}</Panel> : null}
      {conflict && (
        <div className="rounded-md border border-warning/40 bg-warning/10 text-warning px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <div><strong>Assessment conflict —</strong> two submissions within 24h detected on Y-3007. Please review before sending any action.</div>
        </div>
      )}

      {selected.length > 0 && (
        <Panel className="border-primary/30">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">{selected.length} selected</span>
            <button disabled={sending} onClick={() => void sendBulk("Awareness pack sent")} className="text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground disabled:opacity-60">Send awareness pack</button>
            <button disabled={sending} onClick={() => void sendBulk("Group session scheduled")} className="text-xs h-8 px-3 rounded-md border border-border disabled:opacity-60">Schedule group session</button>
            <button onClick={() => void sendBulk("Selection exported")} className="text-xs h-8 px-3 rounded-md border border-border">Export selection</button>
          </div>
        </Panel>
      )}

      <Panel title="Action queue" action={<Disclaimer />}>
        {queue.length === 0 ? <EmptyState message="No awareness actions queued." /> : (
          <div className="space-y-3">
            {queue.map((a) => (
              <div key={a.id} className="border border-border rounded-md p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  {currentUser.role !== "Operator" && (
                    <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} className="mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm">{a.profileId}</span>
                      <YouthRiskBadge level={a.riskLevel} />
                      <ActionTypeBadge type={a.type} />
                      <ActionStatusBadge status={a.status} />
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-teal/30 bg-teal/5 text-teal">
                        <ShieldCheck className="w-3 h-3" /> Supportive, not disciplinary
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5"><span className="font-medium text-foreground">Rationale:</span> {a.rationale}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Channel: {a.channel} · Assigned: {a.counselor} · {a.date}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUser.role !== "Operator" && (
                      <>
                        <button onClick={() => void updateActionStatus(a.actionPk, "sent", "Marked sent")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Mark sent</button>
                        <button onClick={() => void updateActionStatus(a.actionPk, "acknowledged", "Outcome logged")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Log outcome</button>
                        <button onClick={() => void updateActionStatus(a.actionPk, "escalated", "Escalated")} className="text-xs px-2 py-1 border border-warning/30 bg-warning/10 text-warning rounded hover:bg-warning/20">Escalate</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Dialog open={blocked} onOpenChange={setBlocked}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Action blocked</DialogTitle>
            <DialogDescription>Only counselors can send awareness actions. Request escalation from your supervisor.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setBlocked(false)} className="h-9 px-4 text-sm rounded-md border border-border">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
