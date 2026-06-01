import { useEffect, useState } from "react";
import { Panel } from "@/components/shared/Panel";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useApp, type FailureKey } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import { users } from "@/lib/mockData";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

const FAILURE_LABELS: Record<Exclude<FailureKey, null>, string> = {
  S2_MALFORMED: "S2 — Malformed intake (case C-1054 flagged)",
  S2_UNAUTHORIZED: "S2 — Unauthorized referral (audit log demo)",
  S2_MISSED_CASCADE: "S2 — Missed-session cascade alerts",
  S3_ASSESSMENT_CONFLICT: "S3 — Assessment conflict (Y-3007)",
  S3_UNAUTHORIZED: "S3 — Unauthorized awareness action",
};

export default function Settings() {
  const { currentUser, failure, cycleFailure } = useApp();
  const { t } = useI18n();
  const { data: teamData } = useQuery({
    queryKey: ["settings-users-team", currentUser.role],
    queryFn: () => backendApi.usersList(),
    enabled: currentUser.role === "Admin",
  });
  const { data: policies } = useQuery({
    queryKey: ["settings-policies"],
    queryFn: () => backendApi.settingsPoliciesGet(),
    enabled: currentUser.role === "Admin",
  });

  const [awarenessOptIn, setAwarenessOptIn] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [anonymizeExports, setAnonymizeExports] = useState(true);
  const [savingPolicies, setSavingPolicies] = useState(false);

  useEffect(() => {
    if (!policies) return;
    setAwarenessOptIn(Boolean(policies.awareness_opt_in));
    setAutoAssign(Boolean(policies.auto_assign_counselor));
    setAnonymizeExports(Boolean(policies.anonymize_exports));
  }, [policies]);

  const team =
    currentUser.role === "Admin" && Array.isArray(teamData)
      ? (teamData as any[]).map((u) => ({
          id: String(u.id),
          initials: (u.name ?? u.username ?? "US")
            .split(" ")
            .slice(0, 2)
            .map((part: string) => part[0] ?? "")
            .join("")
            .toUpperCase(),
          name: u.name ?? u.username,
          username: u.username,
          role: (u.role ?? "Operator") as "Operator" | "Counselor" | "Admin",
        }))
      : users;

  const savePolicies = async () => {
    setSavingPolicies(true);
    try {
      await backendApi.settingsPoliciesUpdate({
        awareness_opt_in: awarenessOptIn,
        auto_assign_counselor: autoAssign,
        anonymize_exports: anonymizeExports,
      });
      toast.success(t("settings.policiesSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save policies");
    } finally {
      setSavingPolicies(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Panel title={t("language.label")}>
        <LanguageSwitcher />
      </Panel>

      <Panel title={t("settings.account")}>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("settings.name")}</dt>
            <dd>{currentUser.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("settings.username")}</dt>
            <dd>{currentUser.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("settings.role")}</dt>
            <dd>{t(`roles.${currentUser.role}`)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel title={t("settings.team")}>
        <ul className="divide-y divide-border -mx-1">
          {team.map((u) => (
            <li key={u.id} className="px-1 py-2.5 flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {u.initials}
              </div>
              <div className="flex-1">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.username}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded border border-border">{t(`roles.${u.role}`)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {currentUser.role === "Admin" && (
        <>
          <Panel title={t("settings.policies")}>
            <div className="space-y-3 text-sm">
              <label className="flex items-center justify-between gap-4">
                <span>{t("settings.policyAwareness")}</span>
                <input type="checkbox" checked={awarenessOptIn} onChange={(e) => setAwarenessOptIn(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>{t("settings.policyAutoAssign")}</span>
                <input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>{t("settings.policyAnonymize")}</span>
                <input type="checkbox" checked={anonymizeExports} onChange={(e) => setAnonymizeExports(e.target.checked)} />
              </label>
              <button
                onClick={() => void savePolicies()}
                disabled={savingPolicies}
                className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60"
              >
                {savingPolicies ? "Saving..." : t("settings.savePolicies")}
              </button>
            </div>
          </Panel>

          <Panel title="Exam: failure-injection demo">
            <p className="text-xs text-muted-foreground mb-3">
              Cycles controlled UI states for oral defense evidence (Scenario 2 &amp; 3). Check Audit Log and
              affected pages after each step.
            </p>
            <p className="text-sm font-medium mb-2">
              Active: {failure ? FAILURE_LABELS[failure] : "None (normal operation)"}
            </p>
            <button
              type="button"
              onClick={() => {
                cycleFailure();
                toast.message("Failure mode cycled", {
                  description: "Visit Cases, Alerts, Youth detail, or Audit Log to see the effect.",
                });
              }}
              className="h-9 px-4 text-sm rounded-md border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
            >
              Cycle failure scenario
            </button>
          </Panel>
        </>
      )}
    </div>
  );
}
