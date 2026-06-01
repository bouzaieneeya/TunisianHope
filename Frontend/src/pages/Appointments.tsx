import { useEffect, useMemo, useState } from "react";

import { Panel, EmptyState } from "@/components/shared/Panel";

import { AppointmentStatusBadge } from "@/components/shared/Badges";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Plus, Send } from "lucide-react";

import { useApp } from "@/context/AppContext";

import { toast } from "sonner";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";



function mapSessionStatus(status: string) {

  if (status === "present") return "Attended";

  if (status === "absent") return "Missed";

  if (status === "cancelled") return "Cancelled";

  return "Confirmed";

}



export default function Appointments() {

  const { currentUser } = useApp();

  const queryClient = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<{ caseId: string; casePk?: number }>({ caseId: "" });

  const [scheduleOpen, setScheduleOpen] = useState(false);

  const [scheduleCaseCode, setScheduleCaseCode] = useState("");

  const [scheduleDate, setScheduleDate] = useState("");

  const [scheduleNotes, setScheduleNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);



  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];



  const { data: caseRows } = useQuery({

    queryKey: ["appointments-cases", currentUser.role],

    queryFn: () => backendApi.scenario2Cases(currentUser.role),

  });

  const { data: liveSessions } = useQuery({

    queryKey: ["appointments-sessions", currentUser.role],

    queryFn: () => backendApi.scenario2Sessions(currentUser.role),

  });



  const sourceData = useMemo(() => {

    return ((liveSessions ?? []) as any[]).map((s) => ({

      id: `AP-${s.id}`,

      sessionPk: s.id as number,

      casePk: s.case_id as number,

      caseId: s.case_code,

      patientInitials: s.case_code,

      date: `${s.scheduled_date}T09:00:00`,

      type: "Follow-up",

      counselor: s.counselor,

      status: mapSessionStatus(s.status),

      notes: s.notes,

    }));

  }, [liveSessions]);



  const missedByCase = useMemo(() => {

    const map: Record<string, number> = {};

    const caseIds = Array.from(new Set(sourceData.map((a) => a.caseId)));

    caseIds.forEach((caseId) => {

      const sorted = sourceData

        .filter((a) => a.caseId === caseId)

        .sort((a, b) => +new Date(a.date) - +new Date(b.date));

      let streak = 0;

      let max = 0;

      sorted.forEach((a) => {

        if (a.status === "Missed") {

          streak++;

          max = Math.max(max, streak);

        } else streak = 0;

      });

      map[caseId] = max;

    });

    return map;

  }, [sourceData]);



  const invalidate = async () => {

    await queryClient.invalidateQueries({ queryKey: ["appointments-sessions", currentUser.role] });

    await queryClient.invalidateQueries({ queryKey: ["scenario2-dashboard", currentUser.role] });

  };



  const updateSessionStatus = async (sessionPk: number, status: "present" | "absent") => {

    try {

      await backendApi.scenario2UpdateSession(currentUser.role, sessionPk, { status });

      await invalidate();

      toast.success(status === "present" ? "Marked attended" : "Marked missed");

    } catch (err) {

      toast.error(err instanceof Error ? err.message : "Could not update session");

    }

  };



  const sendReminder = (caseId: string, casePk?: number) => {

    setConfirmTarget({ caseId, casePk });

    setConfirmOpen(true);

  };



  const confirmReminder = async () => {

    if (!confirmTarget.casePk) {

      toast.error("Case not found in backend.");

      return;

    }

    try {

      await backendApi.scenario2SendReminder(currentUser.role, confirmTarget.casePk);

      await invalidate();

      setConfirmOpen(false);

      toast.success("Reminder sent and logged");

    } catch (err) {

      toast.error(err instanceof Error ? err.message : "Could not send reminder");

    }

  };



  const triggerReferral = async (casePk: number) => {

    try {

      await backendApi.scenario2TriggerReferral(currentUser.role, casePk, "Missed sessions threshold reached");

      await invalidate();

      toast.success("Referral triggered");

    } catch (err) {

      toast.error(err instanceof Error ? err.message : "Referral failed");

    }

  };



  const caseOptions = (caseRows ?? []) as any[];

  useEffect(() => {
    const rows = (caseRows ?? []) as any[];
    if (scheduleOpen && rows.length > 0 && !scheduleCaseCode) {
      setScheduleCaseCode(rows[0].code);
    }
  }, [scheduleOpen, caseRows, scheduleCaseCode]);

  const resolveCaseRow = () => {
    const raw = scheduleCaseCode.trim();
    if (!raw) return undefined;
    return (
      caseOptions.find((c) => c.code === raw) ||
      caseOptions.find((c) => String(c.code).toLowerCase() === raw.toLowerCase())
    );
  };

  const openScheduleDialog = (open: boolean) => {
    setScheduleOpen(open);
    if (open) {
      if (caseOptions.length > 0) {
        setScheduleCaseCode((prev) => prev || caseOptions[0].code);
      } else {
        setScheduleCaseCode("");
      }
    }
  };

  const submitSchedule = async () => {
    const caseRow = resolveCaseRow();

    if (!caseRow?.id) {
      toast.error(
        caseOptions.length === 0
          ? "No cases available. Create a case first."
          : "Select a case from the list.",
      );
      return;
    }

    if (!scheduleDate) {

      toast.error("Select a date.");

      return;

    }

    setSubmitting(true);

    try {

      const dateOnly = scheduleDate.slice(0, 10);

      await backendApi.scenario2CreateSession(currentUser.role, caseRow.id, {

        scheduled_date: dateOnly,

        status: "scheduled",

        notes: scheduleNotes.trim(),

      });

      await invalidate();

      setScheduleOpen(false);

      setScheduleCaseCode("");

      setScheduleDate("");

      setScheduleNotes("");

      toast.success("Appointment scheduled");

    } catch (err) {

      toast.error(err instanceof Error ? err.message : "Could not schedule appointment");

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <div className="space-y-4">

      <Tabs defaultValue="list">

        <div className="flex items-center justify-between gap-2">

          <TabsList>

            <TabsTrigger value="calendar">Calendar</TabsTrigger>

            <TabsTrigger value="list">List</TabsTrigger>

          </TabsList>

          <Dialog open={scheduleOpen} onOpenChange={openScheduleDialog}>

            <DialogTrigger asChild>

              <button className="h-9 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5">

                <Plus className="w-4 h-4" /> Schedule appointment

              </button>

            </DialogTrigger>

            <DialogContent>

              <DialogHeader>

                <DialogTitle>Schedule appointment</DialogTitle>

                <DialogDescription>Creates a follow-up session linked to the case.</DialogDescription>

              </DialogHeader>

              <div className="space-y-3">

                <div>
                  <label className="text-xs text-muted-foreground">Case</label>
                  {caseOptions.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">Loading cases…</p>
                  ) : (
                    <Select value={scheduleCaseCode} onValueChange={setScheduleCaseCode}>
                      <SelectTrigger className="mt-1 h-9 text-sm">
                        <SelectValue placeholder="Select a case" />
                      </SelectTrigger>
                      <SelectContent>
                        {caseOptions.map((c) => (
                          <SelectItem key={c.id} value={c.code}>
                            {c.code} · age {c.age} · {c.risk_level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <input

                  type="datetime-local"

                  value={scheduleDate}

                  onChange={(e) => setScheduleDate(e.target.value)}

                  className="w-full h-9 px-3 text-sm border border-border rounded-md"

                />

                <textarea

                  value={scheduleNotes}

                  onChange={(e) => setScheduleNotes(e.target.value)}

                  className="w-full px-3 py-2 text-sm border border-border rounded-md"

                  placeholder="Notes"

                  rows={3}

                />

              </div>

              <DialogFooter>

                <button

                  onClick={() => void submitSchedule()}

                  disabled={submitting}

                  className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60"

                >

                  {submitting ? "Saving..." : "Submit"}

                </button>

              </DialogFooter>

            </DialogContent>

          </Dialog>

        </div>



        <TabsContent value="calendar" className="mt-4">

          <Panel title="This week">

            <div className="overflow-x-auto">

              <div className="grid grid-cols-8 gap-2 min-w-[700px] text-xs">

                <div></div>

                {days.map((d) => (

                  <div key={d} className="text-center font-medium text-muted-foreground py-1">

                    {d}

                  </div>

                ))}

                {slots.map((slot) => (

                  <div key={slot} className="contents">

                    <div className="text-right pr-2 py-3 text-muted-foreground">{slot}</div>

                    {days.map((d, i) => {

                      const ap = sourceData.find(

                        (a) =>

                          new Date(a.date).getDay() === (i + 1) % 7 &&

                          new Date(a.date).getHours() === parseInt(slot, 10),

                      );

                      return (

                        <div key={d + slot} className="border border-border rounded-md min-h-[44px] p-1">

                          {ap && (

                            <div

                              className={`text-[10px] rounded px-1.5 py-1 ${

                                ap.status === "Attended"

                                  ? "bg-success/10 text-success"

                                  : ap.status === "Missed"

                                    ? "bg-destructive/10 text-destructive"

                                    : ap.status === "Cancelled"

                                      ? "bg-muted text-muted-foreground"

                                      : "bg-info/10 text-info"

                              }`}

                            >

                              {ap.patientInitials}

                            </div>

                          )}

                        </div>

                      );

                    })}

                  </div>

                ))}

              </div>

            </div>

          </Panel>

        </TabsContent>



        <TabsContent value="list" className="mt-4">

          <Panel>

            {sourceData.length === 0 ? (

              <EmptyState message="No appointments." />

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">

                    <tr>

                      {["Date/Time", "Patient", "Counselor", "Type", "Status", "Actions"].map((h) => (

                        <th key={h} className="text-left font-medium px-3 py-2">

                          {h}

                        </th>

                      ))}

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-border">

                    {sourceData.slice(0, 25).map((a) => {

                      const missedStreak = missedByCase[a.caseId] ?? 0;

                      const rowCls =

                        missedStreak >= 3

                          ? "bg-destructive/5"

                          : missedStreak >= 2

                            ? "bg-warning/5"

                            : "";

                      return (

                        <tr key={a.id} className={rowCls}>

                          <td className="px-3 py-2 text-xs">{new Date(a.date).toLocaleString()}</td>

                          <td className="px-3 py-2 font-mono text-xs">{a.caseId}</td>

                          <td className="px-3 py-2 text-muted-foreground">{a.counselor}</td>

                          <td className="px-3 py-2">{a.type}</td>

                          <td className="px-3 py-2">

                            <AppointmentStatusBadge status={a.status} />

                          </td>

                          <td className="px-3 py-2">

                            <div className="flex items-center gap-1.5 flex-wrap">

                              {currentUser.role !== "Operator" && a.status === "Confirmed" && (

                                <button

                                  onClick={() => void updateSessionStatus(a.sessionPk, "present")}

                                  className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"

                                >

                                  Mark attended

                                </button>

                              )}

                              {currentUser.role !== "Operator" && a.status === "Confirmed" && (

                                <button

                                  onClick={() => void updateSessionStatus(a.sessionPk, "absent")}

                                  className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"

                                >

                                  Mark missed

                                </button>

                              )}

                              {missedStreak >= 2 && (

                                <button

                                  onClick={() => sendReminder(a.caseId, a.casePk)}

                                  className="text-xs px-2 py-1 rounded border border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 flex items-center gap-1"

                                >

                                  <Send className="w-3 h-3" />

                                  Send Reminder

                                </button>

                              )}

                              {missedStreak >= 3 && currentUser.role === "Counselor" && (

                                <button

                                  onClick={() => void triggerReferral(a.casePk)}

                                  className="text-xs px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"

                                >

                                  Trigger Referral

                                </button>

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

            <DialogDescription>

              An automated reminder will be sent for case {confirmTarget.caseId} and logged to the case timeline.

            </DialogDescription>

          </DialogHeader>

          <DialogFooter>

            <button onClick={() => setConfirmOpen(false)} className="h-9 px-4 text-sm rounded-md border border-border">

              Cancel

            </button>

            <button

              onClick={() => void confirmReminder()}

              className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground"

            >

              Confirm

            </button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );

}


