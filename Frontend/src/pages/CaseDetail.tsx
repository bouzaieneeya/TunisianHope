import { useParams, Link } from "react-router-dom";
import { cases, caseTimelines, caseRiskIndicators, appointments, TimelineEvent } from "@/lib/mockData";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { CaseStatusBadge, RiskBadge, AppointmentStatusBadge, Disclaimer } from "@/components/shared/Badges";
import Timeline from "@/components/shared/Timeline";
import ActionModal from "@/components/shared/ActionModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { useApp } from "@/context/AppContext";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

function nowLabel() {
  return new Date().toLocaleString();
}

function mapAuditToTimeline(entries: any[]): TimelineEvent[] {
  return entries.map((e: any) => ({
    id: String(e.id),
    type: e.action?.toLowerCase().includes("referral")
      ? "Referral Triggered"
      : e.action?.toLowerCase().includes("note")
        ? "Note Added"
        : "Status Changed",
    timestamp: new Date(e.timestamp).toLocaleString(),
    actorRole: "Counselor" as const,
    actorInitials: (e.actor_name ?? "SYS").slice(0, 2).toUpperCase(),
    label: e.action,
    note: e.reason,
  }));
}

export default function CaseDetail() {
  const { id = "" } = useParams();
  const { currentUser, failure } = useApp();
  const queryClient = useQueryClient();
  const {
    data: liveDetail,
    isLoading: isCaseLoading,
    isError: isCaseError,
    error: caseError,
  } = useQuery({
    queryKey: ["scenario2-case-detail", currentUser.role, id],
    queryFn: () => backendApi.scenario2CaseDetail(currentUser.role, id),
    enabled: Boolean(id),
  });

  const staticCase = cases.find((x) => x.id === id);
  const c = liveDetail
    ? {
        id: liveDetail.case.code,
        casePk: liveDetail.case.id as number,
        initials: liveDetail.case.code.split("-")[1],
        age: liveDetail.case.age,
        intakeDate: liveDetail.case.intake_date,
        counselor: liveDetail.case.counselor,
        status:
          liveDetail.case.status === "new"
            ? "New"
            : liveDetail.case.status === "in_review"
              ? "In Assessment"
              : liveDetail.case.status === "active" || liveDetail.case.status === "followup"
                ? "Active Follow-up"
                : liveDetail.case.status === "alert"
                  ? "Referred"
                  : liveDetail.case.status === "closed"
                    ? "Closed"
                    : "Flagged",
        riskLevel:
          liveDetail.case.risk_level === "low"
            ? "Low"
            : liveDetail.case.risk_level === "medium"
              ? "Moderate"
              : liveDetail.case.risk_level === "high"
                ? "High"
                : "Critical",
      }
    : staticCase
      ? {
          id: staticCase.id,
          casePk: undefined as number | undefined,
          initials: staticCase.initials,
          age: staticCase.age,
          intakeDate: staticCase.intakeDate,
          counselor: staticCase.counselor,
          status: staticCase.status,
          riskLevel: staticCase.riskLevel,
        }
      : undefined;

  const baseTimeline = useMemo(() => {
    if ((liveDetail?.timeline ?? []).length > 0) {
      return mapAuditToTimeline(liveDetail.timeline);
    }
    return caseTimelines[id] ?? caseTimelines["C-1042"] ?? [];
  }, [id, liveDetail]);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(baseTimeline);
  const [caseStatus, setCaseStatus] = useState(c?.status ?? "Active Follow-up");
  const [showEvidence, setShowEvidence] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState("");

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");

  const [referralOpen, setReferralOpen] = useState(false);
  const [referralReason, setReferralReason] = useState("");
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");

  useEffect(() => {
    setTimelineEvents(baseTimeline);
  }, [baseTimeline]);

  useEffect(() => {
    if (c?.status) setCaseStatus(c.status);
  }, [c?.status]);

  if (isCaseLoading) return <Panel><EmptyState message="Loading case details..." /></Panel>;
  if (isCaseError) {
    const msg = caseError instanceof Error ? caseError.message : "Case details could not be loaded.";
    return <Panel><EmptyState message={msg} /></Panel>;
  }
  if (!c) return <Panel><EmptyState message="Case not found." /></Panel>;

  const isFlagged = failure === "S2_MALFORMED" && id === "C-1054";
  const indicators = caseRiskIndicators(id);
  const caseAppts =
    liveDetail?.sessions?.map((s: any) => ({
      id: s.id,
      caseId: c.id,
      patientInitials: c.initials,
      date: `${s.scheduled_date}T09:00:00`,
      type: "Follow-up",
      counselor: c.counselor,
      status:
        s.status === "present" ? "Attended" : s.status === "absent" ? "Missed" : s.status === "cancelled" ? "Cancelled" : "Confirmed",
      notes: s.notes,
    })) ?? appointments.filter((a) => a.caseId === id);

  const openReferral = () => {
    if (currentUser.role === "Operator") {
      setBlockedMsg("Your role (Operator) cannot trigger referrals. Contact your assigned counselor.");
      setBlockedOpen(true);
      return;
    }
    setReferralReason("");
    setReferralOpen(true);
  };

  const saveNote = async () => {
    const text = noteText.trim();
    if (!text) return;

    setNoteSubmitting(true);
    try {
      if (c.casePk) {
        await backendApi.scenario2AddNote(currentUser.role, c.casePk, text);
        await queryClient.invalidateQueries({
          queryKey: ["scenario2-case-detail", currentUser.role, id],
        });
      } else {
        const event: TimelineEvent = {
          id: `note-${Date.now()}`,
          type: "Note Added",
          timestamp: nowLabel(),
          actorRole: currentUser.role,
          actorInitials: currentUser.initials,
          label: "Clinical note added",
          note: text,
        };
        setTimelineEvents((prev) => [event, ...prev]);
      }
      setNoteText("");
      setNoteOpen(false);
      setActiveTab("notes");
      toast.success("Clinical note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const submitReferral = async () => {
    const reason = referralReason.trim();
    if (!reason) return;

    setReferralSubmitting(true);
    try {
      if (c.casePk) {
        await backendApi.scenario2TriggerReferral(currentUser.role, c.casePk, reason);
        await queryClient.invalidateQueries({ queryKey: ["scenario2-case-detail", currentUser.role, id] });
        await queryClient.invalidateQueries({ queryKey: ["scenario2-cases", currentUser.role] });
        await queryClient.invalidateQueries({ queryKey: ["scenario2-dashboard", currentUser.role] });
      }

      if (!c.casePk) {
        const event: TimelineEvent = {
          id: `ref-${Date.now()}`,
          type: "Referral Triggered",
          timestamp: nowLabel(),
          actorRole: currentUser.role,
          actorInitials: currentUser.initials,
          label: "Referral triggered",
          note: reason,
        };
        setTimelineEvents((prev) => [event, ...prev]);
      }
      setCaseStatus("Referred");
      setReferralReason("");
      setReferralOpen(false);
      toast.success("Referral triggered — case escalated for specialist follow-up");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Referral could not be completed");
    } finally {
      setReferralSubmitting(false);
    }
  };

  const notes = timelineEvents.filter((e) => e.type === "Note Added");

  return (
    <div className="space-y-4">
      <Link to="/cases" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to cases
      </Link>

      {isFlagged && (
        <div className="rounded-md border border-warning/40 bg-warning/10 text-warning px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <div><strong>Validation conflict detected.</strong> An operator must resolve the intake data before this case can proceed.</div>
        </div>
      )}

      <Panel>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">{c.initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">{c.initials}</h2>
              <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
              <CaseStatusBadge status={isFlagged ? "Flagged" : caseStatus} />
              <RiskBadge level={c.riskLevel} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Age {c.age} · Intake {c.intakeDate} · Counselor {c.counselor}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentUser.role === "Counselor" && (
              <button
                onClick={() => { setNoteText(""); setNoteOpen(true); }}
                className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted"
              >
                Add note
              </button>
            )}
            <button onClick={openReferral} className="h-8 px-3 text-xs rounded-md bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20">
              Trigger referral
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Case timeline" className="lg:col-span-2">
          <Timeline events={timelineEvents} />
        </Panel>

        <Panel title="Snapshot">
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-muted-foreground">Sessions attended</dt><dd>{timelineEvents.filter((e) => e.type === "Session Attended").length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Sessions missed</dt><dd>{timelineEvents.filter((e) => e.type === "Session Missed").length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Reminders sent</dt><dd>{timelineEvents.filter((e) => e.type === "Reminder Sent").length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Referrals</dt><dd>{timelineEvents.filter((e) => e.type === "Referral Triggered").length}</dd></div>
          </dl>
        </Panel>
      </div>

      <Panel>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="risk">Risk indicators</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="mt-4">
            {caseAppts.length === 0 ? <EmptyState message="No appointments yet." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>{["Date", "Type", "Status", "Counselor", "Notes"].map((h) => (
                      <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {caseAppts.map((a) => (
                      <tr key={a.id} className={a.status === "Missed" ? "bg-warning/5" : ""}>
                        <td className="px-3 py-2 text-xs">{new Date(a.date).toLocaleString()}</td>
                        <td className="px-3 py-2">{a.type}</td>
                        <td className="px-3 py-2"><AppointmentStatusBadge status={a.status} /></td>
                        <td className="px-3 py-2 text-muted-foreground">{a.counselor}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="risk" className="mt-4 space-y-4">
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={indicators}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="border border-border rounded-md">
              <button onClick={() => setShowEvidence((s) => !s)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50">
                <span>Evidence — rules that fired</span>
                {showEvidence ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {showEvidence && (
                <ul className="px-4 pb-3 pt-1 text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Missed 3 consecutive sessions → referral urgency = 8/10</li>
                  <li>Symptom stability self-report dropped 2 levels → stability = 4/10</li>
                  <li>No family contact recorded in 14 days → social support = 5/10</li>
                  <li>Engagement: 2 of last 4 sessions attended → engagement = 5/10</li>
                </ul>
              )}
            </div>
            <Disclaimer />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            {notes.length === 0 ? (
              <EmptyState message="No clinical notes yet. Add one using the button above." />
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="border border-border rounded-md p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{n.actorInitials}</span>
                      <span>{n.timestamp}</span>
                      {String(n.id).endsWith("7") && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <p className="text-sm mt-1">{n.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </Panel>

      <ActionModal
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title="Add clinical note"
        description={`Document session findings or observations for case ${c.id}.`}
        value={noteText}
        onChange={setNoteText}
        placeholder="Enter clinical note (symptoms, progress, follow-up plan)..."
        onSave={saveNote}
        saveLabel={noteSubmitting ? "Saving..." : "Save note"}
        saveDisabled={noteSubmitting || !noteText.trim()}
      />

      <ActionModal
        open={referralOpen}
        onOpenChange={setReferralOpen}
        title="Trigger referral"
        description={`Escalate ${c.id} to a specialist or external partner. This updates case status and logs the action.`}
        value={referralReason}
        onChange={setReferralReason}
        placeholder="Explain why a referral is needed (missed sessions, risk threshold, counselor assessment)..."
        onSave={submitReferral}
        saveLabel={referralSubmitting ? "Submitting..." : "Confirm referral"}
        saveDisabled={referralSubmitting || !referralReason.trim()}
      />

      <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Action blocked</DialogTitle>
            <DialogDescription>{blockedMsg}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setBlockedOpen(false)} className="h-9 px-4 text-sm rounded-md border border-border hover:bg-muted">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
