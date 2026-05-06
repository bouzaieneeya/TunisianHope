import { Bell, Search, Zap } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@/lib/mockData";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cases": "Mental Health Cases",
  "/appointments": "Appointments",
  "/alerts": "Alerts",
  "/youth-profiles": "Youth Profiles",
  "/risk-monitor": "Digital Risk Monitor",
  "/awareness-actions": "Awareness Actions",
  "/reports": "Reports",
  "/audit-log": "Audit Log",
  "/settings": "Settings",
};

const failureLabels: Record<string, string> = {
  S2_MALFORMED: "S2 — Malformed intake",
  S2_UNAUTHORIZED: "S2 — Unauthorized action",
  S2_MISSED_CASCADE: "S2 — Missed follow-up cascade",
  S3_ASSESSMENT_CONFLICT: "S3 — Assessment conflict",
  S3_UNAUTHORIZED: "S3 — Unauthorized awareness",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { currentUser, setRole, failure, cycleFailure, notifications } = useApp();
  const base = "/" + pathname.split("/")[1];
  const title = titles[base] ?? "Amal";

  return (
    <header className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex-1 max-w-md ml-4 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cases, profiles, alerts..."
            className="w-full h-9 pl-9 pr-3 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Select value={currentUser.role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="h-9 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Operator">Role: Operator</SelectItem>
            <SelectItem value="Counselor">Role: Counselor</SelectItem>
            <SelectItem value="Admin">Role: Admin</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={() => {
            cycleFailure();
            toast.message("Failure mode cycled", { description: "Next state activated for demo." });
          }}
          className={`h-9 px-3 text-xs rounded-md border flex items-center gap-1.5 transition-colors ${
            failure
              ? "border-warning/40 bg-warning/10 text-warning"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
          title="Cycles through demo failure states"
        >
          <Zap className="w-3.5 h-3.5" />
          {failure ? failureLabels[failure] : "Demo: Inject Failure"}
        </button>

        <button className="relative h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] font-semibold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center px-1">
              {notifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
