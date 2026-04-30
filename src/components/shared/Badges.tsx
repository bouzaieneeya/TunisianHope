import { CaseStatus, RiskLevel, AppointmentStatus, AlertStatus, ActionType, ActionStatus } from "@/lib/mockData";

const cls = "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, string> = {
    "New": "bg-muted text-muted-foreground border-border",
    "In Assessment": "bg-info/10 text-info border-info/20",
    "Active Follow-up": "bg-teal/10 text-teal border-teal/30",
    "Referred": "bg-warning/10 text-warning border-warning/30",
    "Closed": "bg-success/10 text-success border-success/30",
    "Flagged": "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={`${cls} ${map[status]}`}>{status}</span>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, string> = {
    "Low": "bg-success/10 text-success border-success/30",
    "Moderate": "bg-info/10 text-info border-info/20",
    "High": "bg-warning/10 text-warning border-warning/30",
    "Critical": "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={`${cls} ${map[level]}`}>{level}</span>;
}

export function YouthRiskBadge({ level }: { level: RiskLevel }) {
  // S3 mapping per spec: Moderate=blue, High=amber
  const map: Record<RiskLevel, string> = {
    "Low": "bg-success/10 text-success border-success/30",
    "Moderate": "bg-info/10 text-info border-info/20",
    "High": "bg-warning/10 text-warning border-warning/30",
    "Critical": "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={`${cls} ${map[level]}`}>{level}</span>;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, string> = {
    "Confirmed": "bg-info/10 text-info border-info/20",
    "Attended": "bg-success/10 text-success border-success/30",
    "Missed": "bg-destructive/10 text-destructive border-destructive/30",
    "Cancelled": "bg-muted text-muted-foreground border-border",
    "At-risk": "bg-warning/10 text-warning border-warning/30",
  };
  return <span className={`${cls} ${map[status]}`}>{status}</span>;
}

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  const map: Record<AlertStatus, string> = {
    "New": "bg-info/10 text-info border-info/20",
    "Acknowledged": "bg-teal/10 text-teal border-teal/30",
    "Escalated": "bg-destructive/10 text-destructive border-destructive/30",
  };
  return <span className={`${cls} ${map[status]}`}>{status}</span>;
}

export function ActionTypeBadge({ type }: { type: ActionType }) {
  const map: Record<ActionType, string> = {
    "Informational": "bg-info/10 text-info border-info/20",
    "Preventive": "bg-teal/10 text-teal border-teal/30",
    "Referral": "bg-warning/10 text-warning border-warning/30",
  };
  return <span className={`${cls} ${map[type]}`}>{type}</span>;
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const map: Record<ActionStatus, string> = {
    "Pending": "bg-muted text-muted-foreground border-border",
    "Sent": "bg-info/10 text-info border-info/20",
    "Acknowledged": "bg-success/10 text-success border-success/30",
    "Escalated": "bg-destructive/10 text-destructive border-destructive/30",
    "No response": "bg-warning/10 text-warning border-warning/30",
  };
  return <span className={`${cls} ${map[status]}`}>{status}</span>;
}

export function AlertTypeBadge({ type }: { type: "Mental Health" | "Digital Risk" }) {
  const map = {
    "Mental Health": "bg-primary/10 text-primary border-primary/20",
    "Digital Risk": "bg-teal/10 text-teal border-teal/30",
  };
  return <span className={`${cls} ${map[type]}`}>{type}</span>;
}

export function Disclaimer() {
  return (
    <div className="text-[11px] text-muted-foreground italic">
      Decision support only — human validation required.
    </div>
  );
}
