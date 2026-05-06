import { Link, useParams } from "react-router-dom";
import { youthProfiles, youthTimelines, youthRiskIndicators, awarenessActions } from "@/lib/mockData";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { YouthRiskBadge, ActionTypeBadge, ActionStatusBadge, Disclaimer } from "@/components/shared/Badges";
import Timeline from "@/components/shared/Timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ArrowLeft, ChevronDown, ChevronRight, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function YouthDetail() {
  const { id = "" } = useParams();
  const { currentUser, failure } = useApp();
  const y = youthProfiles.find(p => p.id === id);
  const [showHow, setShowHow] = useState(true);
  const [blockedOpen, setBlockedOpen] = useState(false);

  if (!y) return <Panel><EmptyState message="Profile not found." /></Panel>;
  const timeline = youthTimelines[id] ?? youthTimelines["Y-3001"];
  const indicators = youthRiskIndicators(id);
  const actions = awarenessActions.filter(a => a.profileId === id);
  const conflict = failure === "S3_ASSESSMENT_CONFLICT" && id === "Y-3007";

  const sendAction = () => {
    if (currentUser.role === "Operator") {
      setBlockedOpen(true);
    } else {
      toast.success("Awareness action sent");
    }
  };

  return (
    <div className="space-y-4">
      <Link to="/youth-profiles" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to profiles</Link>

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
            {currentUser.role === "Operator" && <button onClick={() => toast.success("Edit (demo)")} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted">Edit</button>}
            {currentUser.role === "Counselor" && <button onClick={() => toast.success("Observation added")} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted">Add observation</button>}
            <button onClick={sendAction} className="h-8 px-3 text-xs rounded-md bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20">Send awareness action</button>
            {currentUser.role === "Admin" && <button onClick={() => toast.success("Profile closed")} className="h-8 px-3 text-xs rounded-md border border-border hover:bg-muted">Close profile</button>}
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
            <button onClick={() => setShowHow(s => !s)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50">
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
          <Timeline events={timeline} />
        </Panel>
      </div>

      <Panel>
        <Tabs defaultValue="assessments">
          <TabsList>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="actions">Awareness actions</TabsTrigger>
            <TabsTrigger value="observations">Observations</TabsTrigger>
          </TabsList>

          <TabsContent value="assessments" className="mt-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>{["Date","Submitted by","Risk score","Risk level",""].map(h => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-xs">2026-0{i}-12</td>
                    <td className="px-3 py-2 text-muted-foreground">{y.counselor}</td>
                    <td className="px-3 py-2">{(5 + i * 0.4).toFixed(1)}</td>
                    <td className="px-3 py-2"><YouthRiskBadge level={y.riskLevel} /></td>
                    <td className="px-3 py-2 text-right"><button className="text-xs text-primary hover:underline">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            {actions.length === 0 ? <EmptyState message="No awareness actions yet." /> : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>{["Date","Type","Channel","Counselor","Outcome"].map(h => <th key={h} className="text-left font-medium px-3 py-2">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {actions.map(a => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 text-xs">{a.date}</td>
                      <td className="px-3 py-2"><ActionTypeBadge type={a.type} /></td>
                      <td className="px-3 py-2 text-muted-foreground">{a.channel}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.counselor}</td>
                      <td className="px-3 py-2"><ActionStatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="observations" className="mt-4">
            <ul className="space-y-3">
              {timeline.filter(e => e.type === "Observation Added").map(o => (
                <li key={o.id} className="border border-border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">{o.actorRole} ({o.actorInitials}) · {o.timestamp}</div>
                  <p className="text-sm mt-1">{o.note}</p>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </Panel>

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
