// Mock data store for Tunisian Hope platform - all data is fictional/anonymized
export type Role = "Operator" | "Counselor" | "Admin";

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  initials: string;
}

export const users: User[] = [
  { id: "u1", username: "operator_nour", name: "Nour B.", role: "Operator", initials: "NB" },
  { id: "u2", username: "counselor_sara", name: "Sara M.", role: "Counselor", initials: "SM" },
  { id: "u3", username: "counselor_amine", name: "Amine T.", role: "Counselor", initials: "AT" },
  { id: "u4", username: "admin_karim", name: "Karim H.", role: "Admin", initials: "KH" },
];

export type CaseStatus = "New" | "In Assessment" | "Active Follow-up" | "Referred" | "Closed" | "Flagged";
export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export interface MentalCase {
  id: string;
  initials: string;
  age: number;
  intakeDate: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  counselor: string;
  lastActivity: string;
  flagReason?: string;
}

export const cases: MentalCase[] = [
  { id: "C-1042", initials: "Y.B.", age: 17, intakeDate: "2026-02-12", status: "Active Follow-up", riskLevel: "High", counselor: "Sara M.", lastActivity: "2 hours ago" },
  { id: "C-1043", initials: "M.K.", age: 19, intakeDate: "2026-02-18", status: "In Assessment", riskLevel: "Moderate", counselor: "Amine T.", lastActivity: "1 day ago" },
  { id: "C-1044", initials: "L.S.", age: 16, intakeDate: "2026-03-01", status: "Active Follow-up", riskLevel: "Critical", counselor: "Sara M.", lastActivity: "5 hours ago" },
  { id: "C-1045", initials: "R.T.", age: 18, intakeDate: "2026-03-05", status: "Referred", riskLevel: "High", counselor: "Amine T.", lastActivity: "3 days ago" },
  { id: "C-1046", initials: "F.A.", age: 15, intakeDate: "2026-03-09", status: "New", riskLevel: "Low", counselor: "Sara M.", lastActivity: "6 hours ago" },
  { id: "C-1047", initials: "H.B.", age: 20, intakeDate: "2026-03-12", status: "Closed", riskLevel: "Low", counselor: "Amine T.", lastActivity: "1 week ago" },
  { id: "C-1048", initials: "S.M.", age: 17, intakeDate: "2026-03-15", status: "Active Follow-up", riskLevel: "Moderate", counselor: "Sara M.", lastActivity: "12 hours ago" },
  { id: "C-1049", initials: "K.D.", age: 19, intakeDate: "2026-03-18", status: "Active Follow-up", riskLevel: "High", counselor: "Amine T.", lastActivity: "Yesterday" },
  { id: "C-1050", initials: "N.O.", age: 16, intakeDate: "2026-03-21", status: "In Assessment", riskLevel: "Moderate", counselor: "Sara M.", lastActivity: "3 hours ago" },
  { id: "C-1051", initials: "B.G.", age: 18, intakeDate: "2026-03-25", status: "Active Follow-up", riskLevel: "High", counselor: "Amine T.", lastActivity: "8 hours ago" },
  { id: "C-1052", initials: "T.E.", age: 17, intakeDate: "2026-04-02", status: "Closed", riskLevel: "Low", counselor: "Sara M.", lastActivity: "2 weeks ago" },
  { id: "C-1053", initials: "Z.R.", age: 15, intakeDate: "2026-04-08", status: "Referred", riskLevel: "Critical", counselor: "Amine T.", lastActivity: "4 days ago" },
  { id: "C-1054", initials: "I.W.", age: 19, intakeDate: "2026-04-14", status: "New", riskLevel: "Moderate", counselor: "Sara M.", lastActivity: "Today" },
  { id: "C-1055", initials: "A.J.", age: 18, intakeDate: "2026-04-20", status: "Active Follow-up", riskLevel: "High", counselor: "Amine T.", lastActivity: "5 hours ago" },
];

export type AlertType = "Mental Health" | "Digital Risk";
export type Severity = "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "New" | "Acknowledged" | "Escalated";

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  subjectId: string;
  rule: string;
  triggeredAt: string;
  counselor: string;
  status: AlertStatus;
}

export const alerts: Alert[] = [
  { id: "A-201", type: "Mental Health", severity: "Critical", subjectId: "C-1044", rule: "Missed 3 consecutive sessions — referral recommended", triggeredAt: "2 hours ago", counselor: "Sara M.", status: "New" },
  { id: "A-202", type: "Mental Health", severity: "High", subjectId: "C-1042", rule: "Risk score crossed High threshold (8.2/10)", triggeredAt: "5 hours ago", counselor: "Sara M.", status: "Acknowledged" },
  { id: "A-203", type: "Digital Risk", severity: "Critical", subjectId: "Y-3017", rule: "Cyberbullying indicators score = 9/10", triggeredAt: "1 day ago", counselor: "Amine T.", status: "New" },
  { id: "A-204", type: "Mental Health", severity: "Medium", subjectId: "C-1049", rule: "2 consecutive missed sessions — reminder triggered", triggeredAt: "3 hours ago", counselor: "Amine T.", status: "New" },
  { id: "A-205", type: "Digital Risk", severity: "High", subjectId: "Y-3022", rule: "Screen time excess sustained over 3 weeks", triggeredAt: "8 hours ago", counselor: "Sara M.", status: "New" },
  { id: "A-206", type: "Mental Health", severity: "High", subjectId: "C-1051", rule: "Symptom stability dropped below threshold", triggeredAt: "Yesterday", counselor: "Amine T.", status: "Escalated" },
  { id: "A-207", type: "Digital Risk", severity: "Medium", subjectId: "Y-3009", rule: "Isolation signals detected in last 2 assessments", triggeredAt: "2 days ago", counselor: "Sara M.", status: "Acknowledged" },
  { id: "A-208", type: "Digital Risk", severity: "High", subjectId: "Y-3014", rule: "Social media risk exposure score = 8/10", triggeredAt: "6 hours ago", counselor: "Amine T.", status: "New" },
];

export type AppointmentStatus = "Confirmed" | "Attended" | "Missed" | "Cancelled" | "At-risk";

export interface Appointment {
  id: string;
  caseId: string;
  patientInitials: string;
  date: string; // ISO
  type: string;
  counselor: string;
  status: AppointmentStatus;
  notes?: string;
}

function genAppointments(): Appointment[] {
  const out: Appointment[] = [];
  const types = ["Initial Assessment", "Follow-up", "Therapy Session", "Family Session"];
  const counselors = ["Sara M.", "Amine T."];
  const statuses: AppointmentStatus[] = ["Attended", "Attended", "Attended", "Confirmed", "Missed", "Cancelled"];
  let id = 500;
  for (let w = 0; w < 10; w++) {
    for (let i = 0; i < 4; i++) {
      const c = cases[(w + i) % cases.length];
      const date = new Date();
      date.setDate(date.getDate() - (10 - w) * 7 + i * 2);
      out.push({
        id: `AP-${id++}`,
        caseId: c.id,
        patientInitials: c.initials,
        date: date.toISOString(),
        type: types[i % types.length],
        counselor: counselors[i % 2],
        status: statuses[(w * 4 + i) % statuses.length],
        notes: i % 3 === 0 ? "Routine session." : undefined,
      });
    }
  }
  return out;
}
export const appointments: Appointment[] = genAppointments();

// Adherence weeks
export const adherenceWeeks = Array.from({ length: 12 }, (_, i) => {
  const scheduled = 18 + Math.round(Math.sin(i / 2) * 3);
  const attended = scheduled - (2 + ((i * 3) % 5));
  return { week: `W${i + 1}`, Scheduled: scheduled, Attended: Math.max(0, attended) };
});

export const riskDistribution = [
  { level: "Low", count: 7, color: "hsl(var(--success))" },
  { level: "Moderate", count: 6, color: "hsl(var(--warning))" },
  { level: "High", count: 4, color: "#f97316" },
  { level: "Critical", count: 1, color: "hsl(var(--destructive))" },
];

// Youth profiles
export interface YouthProfile {
  id: string;
  ageGroup: string;
  school: string;
  riskLevel: RiskLevel;
  lastAssessment: string;
  counselor: string;
  status: "Active" | "Closed" | "Pending Review";
  conflict?: boolean;
}

const schools = ["Lycée Carthage", "Centre El Manar", "Lycée Bardo", "Centre Sousse"];
const ageGroups = ["12-14", "15-17", "18-20"];
const riskLevels: RiskLevel[] = ["Low", "Moderate", "High", "Critical"];

export const youthProfiles: YouthProfile[] = Array.from({ length: 18 }, (_, i) => ({
  id: `Y-${3001 + i}`,
  ageGroup: ageGroups[i % 3],
  school: schools[i % 4],
  riskLevel: riskLevels[i % 4],
  lastAssessment: `2026-04-${String(5 + (i % 22)).padStart(2, "0")}`,
  counselor: i % 2 === 0 ? "Sara M." : "Amine T.",
  status: i === 7 ? "Pending Review" : "Active",
}));

// Awareness actions
export type ActionType = "Informational" | "Preventive" | "Referral";
export type ActionChannel = "In-person" | "Online" | "SMS";
export type ActionStatus = "Pending" | "Sent" | "Acknowledged" | "Escalated" | "No response";

export interface AwarenessAction {
  id: string;
  profileId: string;
  riskLevel: RiskLevel;
  type: ActionType;
  channel: ActionChannel;
  counselor: string;
  status: ActionStatus;
  rationale: string;
  date: string;
}

export const awarenessActions: AwarenessAction[] = [
  { id: "AW-101", profileId: "Y-3001", riskLevel: "High", type: "Preventive", channel: "In-person", counselor: "Sara M.", status: "Pending", rationale: "Screen time excess score = 8/10 over 3 consecutive assessments", date: "2026-04-22" },
  { id: "AW-102", profileId: "Y-3007", riskLevel: "Critical", type: "Referral", channel: "In-person", counselor: "Amine T.", status: "Sent", rationale: "Cyberbullying indicators reached 9/10 — counselor follow-up required", date: "2026-04-20" },
  { id: "AW-103", profileId: "Y-3010", riskLevel: "Moderate", type: "Informational", channel: "Online", counselor: "Sara M.", status: "Acknowledged", rationale: "Social media risk exposure trending upward", date: "2026-04-18" },
  { id: "AW-104", profileId: "Y-3014", riskLevel: "High", type: "Preventive", channel: "SMS", counselor: "Amine T.", status: "No response", rationale: "Isolation signals reported by 2 educators", date: "2026-04-15" },
  { id: "AW-105", profileId: "Y-3003", riskLevel: "Moderate", type: "Informational", channel: "In-person", counselor: "Sara M.", status: "Sent", rationale: "Academic digital distraction score moderate-rising", date: "2026-04-19" },
  { id: "AW-106", profileId: "Y-3017", riskLevel: "Critical", type: "Referral", channel: "In-person", counselor: "Amine T.", status: "Escalated", rationale: "Composite risk crossed Critical threshold", date: "2026-04-21" },
  { id: "AW-107", profileId: "Y-3008", riskLevel: "Low", type: "Informational", channel: "Online", counselor: "Sara M.", status: "Acknowledged", rationale: "Preventive awareness campaign — general", date: "2026-04-12" },
  { id: "AW-108", profileId: "Y-3012", riskLevel: "High", type: "Preventive", channel: "In-person", counselor: "Amine T.", status: "Pending", rationale: "Screen time + isolation indicators co-occur", date: "2026-04-23" },
  { id: "AW-109", profileId: "Y-3005", riskLevel: "Moderate", type: "Informational", channel: "SMS", counselor: "Sara M.", status: "No response", rationale: "Mild social media risk exposure", date: "2026-04-10" },
  { id: "AW-110", profileId: "Y-3015", riskLevel: "High", type: "Referral", channel: "In-person", counselor: "Amine T.", status: "Sent", rationale: "Sustained academic distraction + isolation", date: "2026-04-22" },
];

// Timeline events
export type EventType =
  | "Intake Created" | "Assessment Completed" | "Session Attended" | "Session Missed"
  | "Note Added" | "Referral Triggered" | "Reminder Sent" | "Status Changed" | "Case Closed"
  | "Profile Created" | "Assessment Submitted" | "Observation Added" | "Awareness Action Sent"
  | "Counselor Review Completed" | "Risk Level Changed" | "Profile Closed";

export interface TimelineEvent {
  id: string;
  type: EventType;
  timestamp: string;
  actorRole: Role;
  actorInitials: string;
  label: string;
  note?: string;
}

export const caseTimelines: Record<string, TimelineEvent[]> = {
  "C-1042": [
    { id: "e1", type: "Intake Created", timestamp: "2026-02-12 09:14", actorRole: "Operator", actorInitials: "NB", label: "Intake form submitted", note: "Self-referral via school counselor." },
    { id: "e2", type: "Assessment Completed", timestamp: "2026-02-13 14:00", actorRole: "Counselor", actorInitials: "SM", label: "Initial assessment completed", note: "Moderate anxiety symptoms reported." },
    { id: "e3", type: "Session Attended", timestamp: "2026-02-20 10:00", actorRole: "Counselor", actorInitials: "SM", label: "Session 1 attended" },
    { id: "e4", type: "Session Missed", timestamp: "2026-02-27 10:00", actorRole: "Counselor", actorInitials: "SM", label: "Session 2 missed" },
    { id: "e5", type: "Reminder Sent", timestamp: "2026-02-27 11:00", actorRole: "Counselor", actorInitials: "SM", label: "Automated reminder sent" },
    { id: "e6", type: "Session Attended", timestamp: "2026-03-06 10:00", actorRole: "Counselor", actorInitials: "SM", label: "Session 3 attended" },
    { id: "e7", type: "Note Added", timestamp: "2026-03-06 11:15", actorRole: "Counselor", actorInitials: "SM", label: "Clinical note added", note: "Patient reports improved sleep." },
    { id: "e8", type: "Status Changed", timestamp: "2026-03-08 09:00", actorRole: "Admin", actorInitials: "KH", label: "Status changed to Active Follow-up" },
  ],
  "C-1044": [
    { id: "e1", type: "Intake Created", timestamp: "2026-03-01 10:00", actorRole: "Operator", actorInitials: "NB", label: "Intake submitted by parent" },
    { id: "e2", type: "Assessment Completed", timestamp: "2026-03-02 15:00", actorRole: "Counselor", actorInitials: "SM", label: "High-risk assessment", note: "Severe depressive indicators." },
    { id: "e3", type: "Session Missed", timestamp: "2026-03-09 10:00", actorRole: "Counselor", actorInitials: "SM", label: "Session 1 missed" },
    { id: "e4", type: "Session Missed", timestamp: "2026-03-16 10:00", actorRole: "Counselor", actorInitials: "SM", label: "Session 2 missed" },
    { id: "e5", type: "Session Missed", timestamp: "2026-03-23 10:00", actorRole: "Counselor", actorInitials: "SM", label: "Session 3 missed" },
    { id: "e6", type: "Referral Triggered", timestamp: "2026-03-23 11:30", actorRole: "Counselor", actorInitials: "SM", label: "Referral to specialist", note: "3 consecutive missed sessions — auto-flagged." },
  ],
  "C-1045": [
    { id: "e1", type: "Intake Created", timestamp: "2026-03-05 09:00", actorRole: "Operator", actorInitials: "NB", label: "Intake created" },
    { id: "e2", type: "Assessment Completed", timestamp: "2026-03-06 14:00", actorRole: "Counselor", actorInitials: "AT", label: "Assessment completed" },
    { id: "e3", type: "Referral Triggered", timestamp: "2026-03-15 10:00", actorRole: "Counselor", actorInitials: "AT", label: "Referred to external partner" },
  ],
  "C-1047": [
    { id: "e1", type: "Intake Created", timestamp: "2026-03-12 09:00", actorRole: "Operator", actorInitials: "NB", label: "Intake created" },
    { id: "e2", type: "Assessment Completed", timestamp: "2026-03-13 11:00", actorRole: "Counselor", actorInitials: "AT", label: "Assessment — low risk" },
    { id: "e3", type: "Session Attended", timestamp: "2026-03-20 10:00", actorRole: "Counselor", actorInitials: "AT", label: "Single session attended" },
    { id: "e4", type: "Case Closed", timestamp: "2026-04-02 16:00", actorRole: "Admin", actorInitials: "KH", label: "Case closed — resolved" },
  ],
};

export const youthTimelines: Record<string, TimelineEvent[]> = {
  "Y-3001": [
    { id: "y1", type: "Profile Created", timestamp: "2026-02-10", actorRole: "Operator", actorInitials: "NB", label: "Profile created" },
    { id: "y2", type: "Assessment Submitted", timestamp: "2026-02-11", actorRole: "Counselor", actorInitials: "SM", label: "Assessment submitted — Moderate" },
    { id: "y3", type: "Observation Added", timestamp: "2026-03-01", actorRole: "Counselor", actorInitials: "SM", label: "Observation added", note: "Reports excessive evening screen use." },
    { id: "y4", type: "Risk Level Changed", timestamp: "2026-03-15", actorRole: "Counselor", actorInitials: "SM", label: "Risk Moderate → High" },
    { id: "y5", type: "Awareness Action Sent", timestamp: "2026-04-22", actorRole: "Counselor", actorInitials: "SM", label: "Preventive in-person action" },
  ],
  "Y-3007": [
    { id: "y1", type: "Profile Created", timestamp: "2026-02-15", actorRole: "Operator", actorInitials: "NB", label: "Profile created" },
    { id: "y2", type: "Assessment Submitted", timestamp: "2026-02-16", actorRole: "Counselor", actorInitials: "AT", label: "Critical risk assessment" },
    { id: "y3", type: "Counselor Review Completed", timestamp: "2026-02-20", actorRole: "Counselor", actorInitials: "AT", label: "Review completed" },
    { id: "y4", type: "Awareness Action Sent", timestamp: "2026-04-20", actorRole: "Counselor", actorInitials: "AT", label: "Referral action sent" },
  ],
  "Y-3017": [
    { id: "y1", type: "Profile Created", timestamp: "2026-03-01", actorRole: "Operator", actorInitials: "NB", label: "Profile created" },
    { id: "y2", type: "Assessment Submitted", timestamp: "2026-03-02", actorRole: "Counselor", actorInitials: "AT", label: "Assessment — Critical" },
    { id: "y3", type: "Awareness Action Sent", timestamp: "2026-04-21", actorRole: "Counselor", actorInitials: "AT", label: "Referral escalated" },
  ],
};

// Risk indicator radars
export const caseRiskIndicators = (id: string) => {
  const seed = id.length;
  return [
    { axis: "Session adherence", score: 4 + (seed % 3) },
    { axis: "Symptom stability", score: 5 + (seed % 4) },
    { axis: "Social support", score: 6 - (seed % 3) },
    { axis: "Engagement", score: 5 + ((seed + 1) % 4) },
    { axis: "Referral urgency", score: 7 + ((seed + 2) % 3) },
  ];
};

export const youthRiskIndicators = (id: string) => {
  const seed = id.length + 2;
  return [
    { axis: "Screen time excess", score: 7 + (seed % 3) },
    { axis: "Social media risk", score: 6 + (seed % 4) },
    { axis: "Cyberbullying", score: 5 + ((seed + 1) % 4) },
    { axis: "Isolation", score: 6 + ((seed + 2) % 3) },
    { axis: "Academic distraction", score: 5 + ((seed + 3) % 4) },
  ];
};

// Risk monitor
export const weeklyHighRisk = Array.from({ length: 16 }, (_, i) => ({
  week: `W${i + 1}`,
  HighRisk: 3 + Math.round(Math.sin(i / 2.5) * 2 + i / 5),
}));

export const indicatorBreakdown = [
  { dim: "Screen time", avg: 6.4 },
  { dim: "Social media", avg: 5.8 },
  { dim: "Cyberbullying", avg: 4.2 },
  { dim: "Isolation", avg: 5.1 },
  { dim: "Academic", avg: 5.6 },
];

export const heatmap = schools.map((s) => ({
  school: s,
  Low: Math.floor(Math.random() * 5) + 2,
  Moderate: Math.floor(Math.random() * 4) + 1,
  High: Math.floor(Math.random() * 3) + 1,
  Critical: Math.floor(Math.random() * 2),
}));

// Audit log
export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  affectedId: string;
  domain: "Follow-up" | "Digital";
  result: "Success" | "Blocked";
  blockReason?: string;
}

export const auditLog: AuditEntry[] = [
  { id: "L-1", timestamp: "2026-04-30 09:14", user: "operator_nour", role: "Operator", action: "Created case", affectedId: "C-1054", domain: "Follow-up", result: "Success" },
  { id: "L-2", timestamp: "2026-04-30 09:22", user: "counselor_sara", role: "Counselor", action: "Added clinical note", affectedId: "C-1042", domain: "Follow-up", result: "Success" },
  { id: "L-3", timestamp: "2026-04-30 10:01", user: "operator_nour", role: "Operator", action: "Trigger referral", affectedId: "C-1044", domain: "Follow-up", result: "Blocked", blockReason: "Operator role cannot trigger referrals" },
  { id: "L-4", timestamp: "2026-04-30 10:33", user: "counselor_amine", role: "Counselor", action: "Sent awareness action", affectedId: "Y-3007", domain: "Digital", result: "Success" },
  { id: "L-5", timestamp: "2026-04-30 11:02", user: "admin_karim", role: "Admin", action: "Updated thresholds", affectedId: "config/thresholds", domain: "Follow-up", result: "Success" },
  { id: "L-6", timestamp: "2026-04-30 11:18", user: "operator_nour", role: "Operator", action: "Send awareness action", affectedId: "Y-3001", domain: "Digital", result: "Blocked", blockReason: "Only counselors can send awareness actions" },
  { id: "L-7", timestamp: "2026-04-29 16:40", user: "counselor_sara", role: "Counselor", action: "Acknowledged alert", affectedId: "A-202", domain: "Follow-up", result: "Success" },
  { id: "L-8", timestamp: "2026-04-29 14:12", user: "counselor_amine", role: "Counselor", action: "Escalated alert", affectedId: "A-206", domain: "Follow-up", result: "Success" },
];

// Reports
export const adherenceTrend = adherenceWeeks.map((w) => ({
  week: w.week,
  rate: Math.round((w.Attended / w.Scheduled) * 100),
}));

export const referralReasons = [
  { reason: "Consecutive missed", count: 6 },
  { reason: "Overdue", count: 3 },
  { reason: "Risk threshold", count: 4 },
  { reason: "Manual", count: 2 },
];

export const avgRiskTrend = Array.from({ length: 16 }, (_, i) => ({
  week: `W${i + 1}`,
  avg: +(4.5 + Math.sin(i / 3) * 0.8 + i * 0.05).toFixed(2),
}));

export const actionOutcomes = [
  { outcome: "Acknowledged", count: 14 },
  { outcome: "No response", count: 6 },
  { outcome: "Escalated", count: 3 },
  { outcome: "Referred", count: 5 },
];

export const profilesByRisk = [
  { name: "Low", value: 7, color: "hsl(var(--success))" },
  { name: "Moderate", value: 6, color: "hsl(var(--warning))" },
  { name: "High", value: 4, color: "#f97316" },
  { name: "Critical", value: 1, color: "hsl(var(--destructive))" },
];
