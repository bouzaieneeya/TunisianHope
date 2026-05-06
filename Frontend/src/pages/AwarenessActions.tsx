import { useState } from "react";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { awarenessActions } from "@/lib/mockData";
import { ActionStatusBadge, ActionTypeBadge, YouthRiskBadge, Disclaimer } from "@/components/shared/Badges";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function AwarenessActions() {
  const { currentUser, failure } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [blocked, setBlocked] = useState(false);

  const conflict = failure === "S3_ASSESSMENT_CONFLICT";

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const sendBulk = (label: string) => {
    if (currentUser.role === "Operator") { setBlocked(true); return; }
    toast.success(`${label} — ${selected.length} profile(s)`);
    setSelected([]);
  };

  return (
    <div className="space-y-4">
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
            <button onClick={() => sendBulk("Awareness pack sent")} className="text-xs h-8 px-3 rounded-md bg-primary text-primary-foreground">Send awareness pack</button>
            <button onClick={() => sendBulk("Group session scheduled")} className="text-xs h-8 px-3 rounded-md border border-border">Schedule group session</button>
            <button onClick={() => sendBulk("Selection exported")} className="text-xs h-8 px-3 rounded-md border border-border">Export selection</button>
          </div>
        </Panel>
      )}

      <Panel title="Action queue" action={<Disclaimer />}>
        {awarenessActions.length === 0 ? <EmptyState message="No awareness actions queued." /> : (
          <div className="space-y-3">
            {awarenessActions.map(a => (
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
                        <button onClick={() => toast.success("Marked sent")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Mark sent</button>
                        <button onClick={() => toast.success("Outcome logged")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Log outcome</button>
                        <button onClick={() => toast.message("Escalated")} className="text-xs px-2 py-1 border border-warning/30 bg-warning/10 text-warning rounded hover:bg-warning/20">Escalate</button>
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
