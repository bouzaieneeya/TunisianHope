import { useState } from "react";
import { Panel } from "@/components/shared/Panel";
import { alerts as data } from "@/lib/mockData";
import { AlertStatusBadge, AlertTypeBadge } from "@/components/shared/Badges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function Alerts() {
  const { currentUser, failure } = useApp();
  const [showConfig, setShowConfig] = useState(false);
  const cascade = failure === "S2_MISSED_CASCADE";
  const extra = cascade ? [
    { id: "A-301", type: "Mental Health" as const, severity: "High" as const, subjectId: "C-1042", rule: "Missed 3 consecutive sessions — escalation triggered (cascade)", triggeredAt: "Just now", counselor: "Sara M.", status: "New" as const },
    { id: "A-302", type: "Mental Health" as const, severity: "High" as const, subjectId: "C-1048", rule: "Missed 3 consecutive sessions — escalation triggered (cascade)", triggeredAt: "Just now", counselor: "Sara M.", status: "New" as const },
    { id: "A-303", type: "Mental Health" as const, severity: "High" as const, subjectId: "C-1049", rule: "Missed 3 consecutive sessions — escalation triggered (cascade)", triggeredAt: "Just now", counselor: "Amine T.", status: "New" as const },
  ] : [];
  const all = [...extra, ...data];
  const active = all.filter(a => a.status !== "Acknowledged" || true); // all in active for demo
  const history = data.filter(a => a.status === "Acknowledged");

  return (
    <div className="space-y-4">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {active.map((a) => (
            <div key={a.id} className="panel panel-body flex items-start gap-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
                a.severity === "Critical" ? "bg-destructive/10 text-destructive" :
                a.severity === "High" ? "bg-warning/10 text-warning" :
                "bg-info/10 text-info"
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{a.subjectId}</span>
                  <AlertTypeBadge type={a.type} />
                  <AlertStatusBadge status={a.status} />
                  <span className="text-[11px] text-muted-foreground">{a.triggeredAt}</span>
                </div>
                <p className="text-sm text-foreground mt-1">{a.rule}</p>
                <p className="text-xs text-muted-foreground">Assigned: {a.counselor}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {currentUser.role === "Counselor" && <button onClick={() => toast.success("Alert acknowledged")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Acknowledge</button>}
                {currentUser.role === "Counselor" && <button onClick={() => toast.message("Alert escalated")} className="text-xs px-2 py-1 border border-warning/30 bg-warning/10 text-warning rounded hover:bg-warning/20">Escalate</button>}
                {currentUser.role === "Admin" && <button onClick={() => toast.success("Alert dismissed")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Dismiss</button>}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {history.map(a => (
            <div key={a.id} className="panel panel-body text-sm flex items-center gap-3">
              <span className="font-mono text-xs">{a.subjectId}</span>
              <span className="flex-1 text-muted-foreground">{a.rule}</span>
              <AlertStatusBadge status={a.status} />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {currentUser.role === "Admin" && (
        <Panel>
          <button onClick={() => setShowConfig(s => !s)} className="w-full flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Threshold configuration</span>
            {showConfig ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showConfig && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Missed sessions before reminder alert" defaultValue={2} />
              <Field label="Missed sessions before referral flag" defaultValue={3} />
              <Field label="Days overdue before escalation" defaultValue={7} />
              <div>
                <label className="text-xs text-muted-foreground">Risk score threshold for high-risk badge</label>
                <input type="range" min={0} max={10} defaultValue={7} className="w-full mt-1" />
              </div>
              <div className="md:col-span-2">
                <button onClick={() => toast.success("Thresholds saved")} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground">Save thresholds</button>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: number }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type="number" defaultValue={defaultValue} className="mt-1 w-full h-9 px-3 text-sm border border-border rounded-md" />
    </div>
  );
}
