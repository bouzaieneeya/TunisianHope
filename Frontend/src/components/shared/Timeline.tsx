import { TimelineEvent, EventType } from "@/lib/mockData";
import {
  FilePlus, ClipboardCheck, CheckCircle2, XCircle, StickyNote, ArrowUpRight,
  Bell, RefreshCw, Lock, UserPlus, FileText, Eye, Sparkles, ShieldCheck, TrendingUp,
} from "lucide-react";

const meta: Record<EventType, { icon: any; color: string }> = {
  "Intake Created": { icon: FilePlus, color: "text-muted-foreground bg-muted" },
  "Assessment Completed": { icon: ClipboardCheck, color: "text-info bg-info/10" },
  "Session Attended": { icon: CheckCircle2, color: "text-success bg-success/10" },
  "Session Missed": { icon: XCircle, color: "text-destructive bg-destructive/10" },
  "Note Added": { icon: StickyNote, color: "text-teal bg-teal/10" },
  "Referral Triggered": { icon: ArrowUpRight, color: "text-warning bg-warning/10" },
  "Reminder Sent": { icon: Bell, color: "text-warning bg-warning/10" },
  "Status Changed": { icon: RefreshCw, color: "text-info bg-info/10" },
  "Case Closed": { icon: Lock, color: "text-muted-foreground bg-muted" },
  "Profile Created": { icon: UserPlus, color: "text-muted-foreground bg-muted" },
  "Assessment Submitted": { icon: FileText, color: "text-info bg-info/10" },
  "Observation Added": { icon: Eye, color: "text-teal bg-teal/10" },
  "Awareness Action Sent": { icon: Sparkles, color: "text-teal bg-teal/10" },
  "Counselor Review Completed": { icon: ShieldCheck, color: "text-info bg-info/10" },
  "Risk Level Changed": { icon: TrendingUp, color: "text-warning bg-warning/10" },
  "Profile Closed": { icon: Lock, color: "text-muted-foreground bg-muted" },
};

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {events.map((e) => {
        const m = meta[e.type];
        const Icon = m.icon;
        return (
          <li key={e.id} className="ml-4">
            <span className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${m.color}`}>
              <Icon className="w-3 h-3" />
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">{e.label}</span>
              <span className="text-[11px] text-muted-foreground">{e.timestamp}</span>
              <span className="text-[11px] text-muted-foreground">· {e.actorRole} ({e.actorInitials})</span>
            </div>
            {e.note && <p className="text-xs text-muted-foreground mt-1">{e.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
