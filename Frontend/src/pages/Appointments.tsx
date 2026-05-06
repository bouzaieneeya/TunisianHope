import { useMemo, useState } from "react";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { appointments as data, cases } from "@/lib/mockData";
import { AppointmentStatusBadge } from "@/components/shared/Badges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function Appointments() {
  const { currentUser } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string>("");

  // build week grid (last week)
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const slots = ["09:00","10:00","11:00","14:00","15:00","16:00"];

  // missed counts per case (consecutive)
  const missedByCase = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => {
      const sorted = data.filter(a => a.caseId === c.id).sort((a,b) => +new Date(a.date) - +new Date(b.date));
      let streak = 0; let max = 0;
      sorted.forEach(a => { if (a.status === "Missed") { streak++; max = Math.max(max, streak); } else streak = 0; });
      map[c.id] = max;
    });
    return map;
  }, []);

  const sendReminder = (caseId: string) => {
    setConfirmTarget(caseId);
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <Dialog>
            <DialogTrigger asChild>
              <button className="h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Schedule appointment
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule appointment</DialogTitle>
                <DialogDescription>Submits to POST /api/appointments/ (mock).</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <input className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Patient (search by ID/initials)" />
                <input type="datetime-local" className="w-full h-9 px-3 text-sm border border-border rounded-md" />
                <input className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Type (Follow-up, Therapy...)" />
                <input className="w-full h-9 px-3 text-sm border border-border rounded-md" placeholder="Counselor" />
                <textarea className="w-full px-3 py-2 text-sm border border-border rounded-md" placeholder="Notes" rows={3} />
              </div>
              <DialogFooter>
                <button onClick={() => toast.success("Appointment scheduled")} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground">Submit</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="calendar" className="mt-4">
          <Panel title="This week">
            <div className="overflow-x-auto">
              <div className="grid grid-cols-8 gap-2 min-w-[700px] text-xs">
                <div></div>
                {days.map(d => <div key={d} className="text-center font-medium text-muted-foreground py-1">{d}</div>)}
                {slots.map((slot) => (
                  <>
                    <div key={slot} className="text-right pr-2 py-3 text-muted-foreground">{slot}</div>
                    {days.map((d, i) => {
                      const ap = data.find(a => new Date(a.date).getDay() === ((i+1)%7) && new Date(a.date).getHours() === parseInt(slot));
                      return (
                        <div key={d+slot} className="border border-border rounded-md min-h-[44px] p-1">
                          {ap && (
                            <div className={`text-[10px] rounded px-1.5 py-1 ${
                              ap.status === "Attended" ? "bg-success/10 text-success" :
                              ap.status === "Missed" ? "bg-destructive/10 text-destructive" :
                              ap.status === "Cancelled" ? "bg-muted text-muted-foreground" :
                              "bg-info/10 text-info"
                            }`}>
                              {ap.patientInitials}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Panel>
            {data.length === 0 ? <EmptyState message="No appointments." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>{["Date/Time","Patient","Counselor","Type","Status","Actions"].map(h => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.slice(0, 25).map((a) => {
                      const missedStreak = missedByCase[a.caseId] ?? 0;
                      const rowCls = missedStreak >= 3 ? "bg-destructive/5" : missedStreak >= 2 ? "bg-warning/5" : "";
                      return (
                        <tr key={a.id} className={rowCls}>
                          <td className="px-3 py-2 text-xs">{new Date(a.date).toLocaleString()}</td>
                          <td className="px-3 py-2 font-mono text-xs">{a.caseId}</td>
                          <td className="px-3 py-2 text-muted-foreground">{a.counselor}</td>
                          <td className="px-3 py-2">{a.type}</td>
                          <td className="px-3 py-2"><AppointmentStatusBadge status={a.status} /></td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {currentUser.role !== "Operator" && a.status === "Confirmed" && <button onClick={() => toast.success("Marked attended")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Mark attended</button>}
                              {currentUser.role !== "Operator" && a.status === "Confirmed" && <button onClick={() => toast.message("Marked missed")} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">Mark missed</button>}
                              {missedStreak >= 2 && (
                                <button onClick={() => sendReminder(a.caseId)} className="text-xs px-2 py-1 rounded border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 flex items-center gap-1"><Send className="w-3 h-3" />Send Reminder</button>
                              )}
                              {missedStreak >= 3 && currentUser.role === "Counselor" && (
                                <button onClick={() => toast.success("Referral triggered")} className="text-xs px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20">Trigger Referral</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send reminder?</DialogTitle>
            <DialogDescription>An automated reminder will be sent for case {confirmTarget} and logged to the case timeline.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setConfirmOpen(false)} className="h-9 px-4 text-sm rounded-md border border-border">Cancel</button>
            <button onClick={() => { setConfirmOpen(false); toast.success("Reminder sent and logged"); }} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground">Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
