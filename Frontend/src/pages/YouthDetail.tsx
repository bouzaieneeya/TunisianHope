import { Link, useParams } from "react-router-dom";
import {
  youthRiskIndicators,
  TimelineEvent,
  ActionType,
  ActionChannel,
} from "@/lib/mockData";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { YouthRiskBadge, ActionTypeBadge, ActionStatusBadge, Disclaimer } from "@/components/shared/Badges";
import Timeline from "@/components/shared/Timeline";
import ActionModal from "@/components/shared/ActionModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, ChevronDown, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

type LocalAction = {
  id: string;
  date: string;
  type: ActionType;
  channel: ActionChannel;
  counselor: string;
  status: string;
};

function nowLabel() {
  return new Date().toLocaleString();
}

export default function YouthDetail() {
  const { id = "" } = useParams();
  const { currentUser, failure } = useApp();
  const queryClient = useQueryClient();
  const {
    data: liveDetail,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["scenario3-profile-detail", currentUser.role, id],
    queryFn: () => backendApi.scenario3ProfileDetail(currentUser.role, id),
    enabled: Boolean(id),
  });

  const y = liveDetail
    ? {
        id: liveDetail.profile.code,
        profilePk: liveDetail.profile.id as number,
        ageGroup: liveDetail.profile.age_group,
        school: liveDetail.profile.school,
        counselor: liveDetail.profile.counselor,
        riskLevel:
          liveDetail.profile.risk_level === "low"
            ? "Low"
            : liveDetail.profile.risk_level === "moderate"
              ? "Moderate"
              : liveDetail.profile.risk_level === "high"
                ? "High"
                : "Critical",
        lastAssessment: liveDetail.profile.last_assessment_date ?? "N/A",
      }
    : undefined;

  const baseTimeline = useMemo(() => {
    if (!liveDetail) return [];
    const assessmentEvents = (liveDetail.assessments ?? []).map((a: any) => ({
      id: `as-${a.id}`,
      type: "Assessment Submitted" as const,
      timestamp: new Date(a.submitted_at).toLocaleString(),
      actorRole: "Counselor" as const,
      actorInitials: (a.submitted_by ?? "CO").slice(0, 2).toUpperCase(),
      label: `Assessment score ${Number(a.risk_score).toFixed(1)}`,
      note: `Risk level: ${a.risk_level}`,
    }));
    const actionEvents = (liveDetail.actions ?? []).map((a: any) => ({
      id: `ac-${a.id}`,
      type: "Awareness Action Sent" as const,
      timestamp: new Date(a.created_at).toLocaleString(),
      actorRole: "Counselor" as const,
      actorInitials: (a.counselor ?? "CO").slice(0, 2).toUpperCase(),
      label: `${a.action_type} via ${a.channel}`,
      note: a.rationale,
    }));
    const observationEvents = (liveDetail.observations ?? []).map((o: any) => ({
      id: `obs-${o.id}`,
      type: "Observation Added" as const,
      timestamp: new Date(o.created_at).toLocaleString(),
      actorRole: "Counselor" as const,
      actorInitials: (o.actor_name ?? "CO").slice(0, 2).toUpperCase(),
      label: "Observation added",
      note: o.text,
    }));
    return [...observationEvents, ...actionEvents, ...assessmentEvents];
  }, [liveDetail]);

  const baseActions = useMemo((): LocalAction[] => {
    return (liveDetail?.actions ?? []).map((a: any) => ({
      id: `AW-${a.id}`,
      date: new Date(a.created_at).toISOString().slice(0, 10),
      type:
        a.action_type === "informational"
          ? "Informational"
          : a.action_type === "preventive"
            ? "Preventive"
            : "Referral",
      channel: a.channel === "in_person" ? "In-person" : a.channel === "sms" ? "SMS" : "Online",
      counselor: a.counselor,
      status: a.status === "no_response" ? "No response" : a.status.charAt(0).toUpperCase() + a.status.slice(1),
    }));
  }, [liveDetail]);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(baseTimeline);
  const [actionList, setActionList] = useState<LocalAction[]>(baseActions);
  const [showHow, setShowHow] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const [observationOpen, setObservationOpen] = useState(false);
  const [observationText, setObservationText] = useState("");

  const [actionOpen, setActionOpen] = useState(false);
  const [actionRationale, setActionRationale] = useState("");
  const [actionType, setActionType] = useState<ActionType>("Preventive");
  const [actionChannel, setActionChannel] = useState<ActionChannel>("In-person");
  const [observationSubmitting, setObservationSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("observations");

  useEffect(() => {
    setTimelineEvents(baseTimeline);
    setActionList(baseActions);
  }, [baseTimeline, baseActions]);

  if (isLoading) return <Panel><EmptyState message="Loading profile..." /></Panel>;
  if (isError) return <Panel><EmptyState message={error instanceof Error ? error.message : "Profile could not be loaded."} /></Panel>;
  if (!y) return <Panel><EmptyState message="Profile not found." /></Panel>;

  const indicators = youthRiskIndicators(id);
  const assessments =
    liveDetail?.assessments?.map((a: any) => ({
      id: a.id,
      date: new Date(a.submitted_at).toISOString().slice(0, 10),
      submittedBy: a.submitted_by,
      riskScore: Number(a.risk_score).toFixed(1),
      riskLevel:
        a.risk_level === "low"
          ? "Low"
          : a.risk_level === "moderate"
            ? "Moderate"
            : a.risk_level === "high"
              ? "High"
              : "Critical",
    })) ?? [];

  const conflict = failure === "S3_ASSESSMENT_CONFLICT" && id === "Y-3007";
  const profilePk = "profilePk" in y ? y.profilePk : undefined;

  const openSendAction = () => {
    if (currentUser.role === "Operator") {
      setBlockedOpen(true);
      return;
    }
    if (conflict) {
      toast.warning("Resolve assessment conflict before sending an action.");
      return;
    }
    setActionRationale("");
    setActionOpen(true);
  };

  const saveObservation = async () => {
    const text = observationText.trim();
    if (!text) return;

    setObservationSubmitting(true);
    try {
      await backendApi.scenario3AddObservation(currentUser.role, id, text);
      await queryClient.invalidateQueries({
        queryKey: ["scenario3-profile-detail", currentUser.role, id],
      });
      setObservationText("");
      setObservationOpen(false);
      setActiveTab("observations");
      toast.success("Observation saved and added to timeline");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save observation");
    } finally {
      setObservationSubmitting(false);
    }
  };

  const saveAwarenessAction = async () => {
    const rationale = actionRationale.trim();
    if (!rationale) return;

    const typeMap = { Informational: "informational", Preventive: "preventive", Referral: "referral" } as const;
    const channelMap = { "In-person": "in_person", Online: "online", SMS: "sms" } as const;

    try {
      if (profilePk) {
        await backendApi.scenario3SendAction(currentUser.role, {
          profile: profilePk,
          action_type: typeMap[actionType],
          channel: channelMap[actionChannel],
          counselor: currentUser.name,
          rationale,
          status: "pending",
        });
        await queryClient.invalidateQueries({ queryKey: ["scenario3-profile-detail", currentUser.role, id] });
      }

      const newAction: LocalAction = {
        id: `AW-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        type: actionType,
        channel: actionChannel,
        counselor: currentUser.name,
        status: "Pending",
      };
      setActionList((prev) => [newAction, ...prev]);

      const event: TimelineEvent = {
        id: `act-${Date.now()}`,
        type: "Awareness Action Sent",
        timestamp: nowLabel(),
        actorRole: currentUser.role,
        actorInitials: currentUser.initials,
        label: `${actionType} action via ${actionChannel}`,
        note: rationale,
      };
      setTimelineEvents((prev) => [event, ...prev]);

      setActionRationale("");
      setActionOpen(false);
      setActiveTab("actions");
      toast.success("Awareness action sent successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send awareness action");
    }
  };

  const observations = timelineEvents.filter((e) => e.type === "Observation Added");

  return (
    <div className="space-y-4">
      <Link to="/youth-profiles" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Back to profiles
      </Link>

      {conflict && (
        <div className="rounded-md border border-warning/40 bg-warning/10 text-warning px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <div><strong>Assessment conflict —</strong> two submissions within 24h detected. Please review before sending any action.</div>
        </div>
      )}

      <Panel>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-teal/10 text-teal flex items-center justify-center text-base font-semibold font-mono">{y.id.split("-")[1]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold font-mono">{y.id}</h2>
              <YouthRiskBadge level={y.riskLevel} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Age {y.ageGroup} · {y.school} · Counselor {y.counselor} · Last assessment {y.lastAssessment}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {currentUser.role === "Counselor" && (
              <button
                onClick={() => { setObservationText(""); setObservationOpen(true); }}
                className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted"
              >
                Add observation
              </button>
            )}
            <button onClick={openSendAction} className="h-8 px-3 text-xs rounded-md bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20">
              Send awareness action
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Digital behavior radar" caption="Scored from assessment questionnaire — never from surveillance." className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={indicators}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="hsl(var(--teal))" fill="hsl(var(--teal))" fillOpacity={0.25} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="border border-border rounded-md mt-3">
            <button onClick={() => setShowHow((s) => !s)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50">
              <span>How this score was computed</span>
              {showHow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {showHow && (
              <ul className="px-4 pb-3 pt-1 text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Screen time excess: questionnaire Q4–Q6 averaged → 8/10</li>
                <li>Social media risk exposure: Q7–Q9 → 7/10</li>
                <li>Cyberbullying indicators: Q10 self-report + counselor observation → 5/10</li>
                <li>Isolation signals: Q11–Q12 social withdrawal items → 6/10</li>
                <li>Academic distraction: Q13 + educator note → 5/10</li>
              </ul>
            )}
          </div>
          <div className="mt-3 rounded-md border border-info/30 bg-info/5 px-3 py-2 text-xs text-info flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5" />
            <span>This is a decision-support tool, not a diagnostic. All recommendations require human counselor validation.</span>
          </div>
          <div className="mt-2"><Disclaimer /></div>
        </Panel>

        <Panel title="Behavior timeline">
          <Timeline events={timelineEvents} />
        </Panel>
      </div>

      <Panel>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="actions">Awareness actions ({actionList.length})</TabsTrigger>
            <TabsTrigger value="observations">Observations ({observations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="assessments" className="mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>{["Date", "Submitted by", "Risk score", "Risk level", ""].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assessments.map((a: { id: number; date: string; submittedBy: string; riskScore: string; riskLevel: string }) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 text-xs">{a.date}</td>
                    <td className="px-3 py-2 text-muted-foreground">{a.submittedBy}</td>
                    <td className="px-3 py-2">{a.riskScore}</td>
                    <td className="px-3 py-2"><YouthRiskBadge level={a.riskLevel as "Low" | "Moderate" | "High" | "Critical"} /></td>
                    <td className="px-3 py-2 text-right"><button className="text-xs text-primary hover:underline">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            {actionList.length === 0 ? (
              <EmptyState message="No awareness actions yet." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>{["Date", "Type", "Channel", "Counselor", "Outcome"].map((h) => (
                    <th key={h} className="text-left font-medium px-3 py-2">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {actionList.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 text-xs">{a.date}</td>
                      <td className="px-3 py-2"><ActionTypeBadge type={a.type} /></td>
                      <td className="px-3 py-2 text-muted-foreground">{a.channel}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.counselor}</td>
                      <td className="px-3 py-2"><ActionStatusBadge status={a.status as "Pending" | "Sent" | "Acknowledged" | "Escalated" | "No response"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="observations" className="mt-4">
            {observations.length === 0 ? (
              <EmptyState message="No observations yet. Add one using the button above." />
            ) : (
              <ul className="space-y-3">
                {observations.map((o) => (
                  <li key={o.id} className="border border-border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">{o.actorRole} ({o.actorInitials}) · {o.timestamp}</div>
                    <p className="text-sm mt-1">{o.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </Panel>

      <ActionModal
        open={observationOpen}
        onOpenChange={setObservationOpen}
        title="Add observation"
        description={`Record a behavioral observation for ${y.id}. It will appear in the timeline and observations tab.`}
        value={observationText}
        onChange={setObservationText}
        placeholder="Describe what you observed (digital habits, mood, school feedback)..."
        onSave={saveObservation}
        saveLabel={observationSubmitting ? "Saving..." : "Save observation"}
        saveDisabled={observationSubmitting || !observationText.trim()}
      />

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send awareness action</DialogTitle>
            <DialogDescription>
              Supportive, non-disciplinary action for {y.id}. Provide a clear rationale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Action type</label>
                <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
                  <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Informational">Informational</SelectItem>
                    <SelectItem value="Preventive">Preventive</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Channel</label>
                <Select value={actionChannel} onValueChange={(v) => setActionChannel(v as ActionChannel)}>
                  <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-person">In-person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Rationale</label>
              <textarea
                value={actionRationale}
                onChange={(e) => setActionRationale(e.target.value)}
                placeholder="Why is this action recommended? Cite observable indicators..."
                rows={4}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" onClick={() => setActionOpen(false)} className="h-9 px-4 text-sm rounded-md border border-border hover:bg-muted">Cancel</button>
            <button
              type="button"
              onClick={saveAwarenessAction}
              disabled={!actionRationale.trim()}
              className="h-9 px-4 text-sm rounded-md bg-teal text-white hover:bg-teal/90 disabled:opacity-50"
            >
              Send action
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Action blocked</DialogTitle>
            <DialogDescription>Only counselors can send awareness actions. Request escalation from your supervisor.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setBlockedOpen(false)} className="h-9 px-4 text-sm rounded-md border border-border hover:bg-muted">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
