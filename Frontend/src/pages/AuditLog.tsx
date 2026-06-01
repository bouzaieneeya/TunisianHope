import { useState } from "react";
import { Panel, EmptyState } from "@/components/shared/Panel";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

type AuditRow = {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  affectedId: string;
  domain: string;
  result: string;
  blockReason?: string;
};

export default function AuditLog() {
  const { currentUser } = useApp();
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-audit-logs", currentUser.role],
    queryFn: () => backendApi.auditLogs(currentUser.role),
  });

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [domain, setDomain] = useState("all");
  const [result, setResult] = useState("all");

  const sourceRows: AuditRow[] = (data ?? []).map((e: any) => ({
    id: e.id,
    timestamp: new Date(e.timestamp).toLocaleString(),
    user: e.user,
    role: e.role,
    action: e.action,
    affectedId: e.affected_id,
    domain: e.domain,
    result: e.result,
    blockReason: e.block_reason || undefined,
  }));

  const rows = sourceRows.filter(
    (r) =>
      (q === "" ||
        r.affectedId.toLowerCase().includes(q.toLowerCase()) ||
        r.action.toLowerCase().includes(q.toLowerCase()) ||
        r.user.toLowerCase().includes(q.toLowerCase())) &&
      (role === "all" || r.role === role) &&
      (domain === "all" || r.domain === domain) &&
      (result === "all" || r.result === result),
  );

  if (isLoading) return <Panel>Loading audit log...</Panel>;
  if (isError) return <Panel>Audit log could not be loaded.</Panel>;

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("audit.searchPlaceholder")}
              className="w-full h-9 ps-9 pe-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="Operator">Operator</SelectItem>
              <SelectItem value="Counselor">Counselor</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
              <SelectItem value="Digital">Digital</SelectItem>
            </SelectContent>
          </Select>
          <Select value={result} onValueChange={setResult}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All results</SelectItem>
              <SelectItem value="Success">Success</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Panel>

      <div className="panel overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState message={t("audit.noEntries")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {[
                    t("audit.timestamp"),
                    t("audit.user"),
                    t("settings.role"),
                    t("audit.action"),
                    t("audit.affected"),
                    t("audit.domain"),
                    t("audit.result"),
                    t("audit.blockReason"),
                  ].map((h) => (
                    <th key={h} className="text-start px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className={r.result === "Blocked" ? "bg-destructive/5" : ""}>
                    <td className="px-3 py-2 text-xs">{r.timestamp}</td>
                    <td className="px-3 py-2">{r.user}</td>
                    <td className="px-3 py-2">{r.role}</td>
                    <td className="px-3 py-2">{r.action}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.affectedId}</td>
                    <td className="px-3 py-2">{r.domain}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded border ${
                          r.result === "Blocked"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-success/30 bg-success/10 text-success"
                        }`}
                      >
                        {r.result}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{r.blockReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
