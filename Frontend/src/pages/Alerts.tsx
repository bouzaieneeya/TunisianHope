import { useState } from "react";
import { Panel } from "@/components/shared/Panel";
import { AlertStatusBadge, AlertTypeBadge } from "@/components/shared/Badges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useI18n } from "@/context/I18nContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";

export default function Alerts() {
  const { currentUser, failure } = useApp();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const {
    data: liveAlerts,
    isLoading: isAlertsLoading,
    isError: isAlertsError,
    error: alertsError,
  } = useQuery({
    queryKey: ["scenario2-alerts", currentUser.role],
    queryFn: () => backendApi.scenario2Alerts(currentUser.role),
  });
  const {
    data: thresholds,
    isLoading: isThresholdsLoading,
    isError: isThresholdsError,
  } = useQuery({
    queryKey: ["scenario2-thresholds", currentUser.role],
    queryFn: () => backendApi.scenario2Thresholds(currentUser.role),
  });
  const [showConfig, setShowConfig] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [missedBeforeAlert, setMissedBeforeAlert] = useState<number>(2);
  const [highRiskThreshold, setHighRiskThreshold] = useState<number>(7);
  const [criticalRiskThreshold, setCriticalRiskThreshold] = useState<number>(9);
  const cascade = failure === "S2_MISSED_CASCADE";
  const extra = cascade ? [
    { id: "A-301", type: "Mental Health" as const, severity: "High" as const, subjectId: "C-1042", rule: "Missed 3 consecutive sessions — escalation triggered (cascade)", triggeredAt: "Just now", counselor: "Sara M.", status: "New" as const },
    { id: "A-302", type: "Mental Health" as const, severity: "High" as const, subjectId: "C-1048", rule: "Missed 3 consecutive sessions — escalation triggered (cascade)", triggeredAt: "Just now", counselor: "Sara M.", status: "New" as const },
    { id: "A-303", type: "Mental Health" as const, severity: "High" as const, subjectId: "C-1049", rule: "Missed 3 consecutive sessions — escalation triggered (cascade)", triggeredAt: "Just now", counselor: "Amine T.", status: "New" as const },
  ] : [];
  const mappedLive = (liveAlerts ?? []).map((a: any) => ({
    id: `A-${a.id}`,
    alertPk: a.id as number,
    type: a.alert_type?.toLowerCase().includes("digital") ? ("Digital Risk" as const) : ("Mental Health" as const),
    severity: a.explanation?.toLowerCase().includes("critical") ? ("Critical" as const) : ("High" as const),
    subjectId: a.case_code,
    rule: a.explanation,
    triggeredAt: new Date(a.created_at).toLocaleString(),
    counselor: "Auto",
    status: a.is_resolved ? "Acknowledged" as const : "New" as const,
  }));

  const runAlertAction = async (
    alertPk: number | undefined,
    action: "acknowledge" | "dismiss" | "escalate",
    successMessage: string,
  ) => {
    if (!alertPk) {
      toast.error("Alert is not available from backend.");
      return;
    }
    try {
      await backendApi.scenario2UpdateAlert(currentUser.role, alertPk, action);
      await queryClient.invalidateQueries({ queryKey: ["scenario2-alerts", currentUser.role] });
      await queryClient.invalidateQueries({ queryKey: ["scenario2-dashboard", currentUser.role] });
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Alert action failed");
    }
  };
  const all = [...extra, ...mappedLive];
  const active = all.filter((a) => a.status !== "Acknowledged");
  const history = all.filter((a) => a.status === "Acknowledged");

  const openConfig = () => {
    setShowConfig((s) => {
      const next = !s;
      if (next && thresholds) {
        setMissedBeforeAlert(thresholds.missed_sessions_before_alert ?? 2);
        setHighRiskThreshold(thresholds.high_risk_threshold ?? 7);
        setCriticalRiskThreshold(thresholds.critical_risk_threshold ?? 9);
      }
      return next;
    });
  };

  const saveThresholds = async () => {
    setSavingThresholds(true);
    try {
      await backendApi.scenario2UpdateThresholds(currentUser.role, {
        missed_sessions_before_alert: missedBeforeAlert,
        high_risk_threshold: highRiskThreshold,
        critical_risk_threshold: criticalRiskThreshold,
      });
      await queryClient.invalidateQueries({ queryKey: ["scenario2-thresholds", currentUser.role] });
      toast.success("Thresholds saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save thresholds");
    } finally {
      setSavingThresholds(false);
    }
  };

  return (
    <div className="space-y-4">
      {isAlertsLoading ? <Panel>Loading alerts...</Panel> : null}
      {isAlertsError ? <Panel>{alertsError instanceof Error ? alertsError.message : "Alerts could not be loaded."}</Panel> : null}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t("common.active")}</TabsTrigger>
          <TabsTrigger value="history">{t("common.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {active.map((a) => (
            <div key={a.id} className="panel panel-body flex items-start gap-3">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
                a.severity === "Critical" ? "bg-destructive/10 text-destructive" :
                a.severity === "High" ? "bg-warning/10 text-warning" :
                "bg-info/10 text-info"
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{a.subjectId}</span>
                  <AlertTypeBadge type={a.type} />
                  <AlertStatusBadge status={a.status} />
                  <span className="text-[11px] text-muted-foreground">{a.triggeredAt}</span>
                </div>
                <p className="text-sm text-foreground mt-1">{a.rule}</p>
                <p className="text-xs text-muted-foreground">Assigned: {a.counselor}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {currentUser.role === "Counselor" && (
                  <button
                    onClick={() => void runAlertAction(a.alertPk, "acknowledge", "Alert acknowledged")}
                    className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                  >
                    {t("common.acknowledge")}
                  </button>
                )}
                {currentUser.role === "Counselor" && (
                  <button
                    onClick={() => void runAlertAction(a.alertPk, "escalate", "Alert escalated")}
                    className="text-xs px-2 py-1 border border-warning/30 bg-warning/10 text-warning rounded hover:bg-warning/20"
                  >
                    {t("common.escalate")}
                  </button>
                )}
                {currentUser.role === "Admin" && (
                  <button
                    onClick={() => void runAlertAction(a.alertPk, "dismiss", "Alert dismissed")}
                    className="text-xs px-2 py-1 border border-border rounded hover:bg-muted"
                  >
                    {t("common.dismiss")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {history.map(a => (
            <div key={a.id} className="panel panel-body text-sm flex items-center gap-3">
              <span className="font-mono text-xs">{a.subjectId}</span>
              <span className="flex-1 text-muted-foreground">{a.rule}</span>
              <AlertStatusBadge status={a.status} />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {currentUser.role === "Admin" && (
        <Panel>
          <button onClick={openConfig} className="w-full flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> {t("alerts.thresholdConfig")}</span>
            {showConfig ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {showConfig && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={t("alerts.missedBeforeReminder")} value={missedBeforeAlert} onChange={setMissedBeforeAlert} />
              <Field label={t("alerts.missedBeforeReferral")} value={missedBeforeAlert + 1} onChange={() => {}} disabled />
              <Field label={t("alerts.daysOverdue")} value={7} onChange={() => {}} disabled />
              <div>
                <label className="text-xs text-muted-foreground">{t("alerts.riskThreshold")}</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={highRiskThreshold}
                    onChange={(e) => setHighRiskThreshold(Number(e.target.value))}
                    className="h-9 px-3 text-sm border border-border rounded-md"
                    placeholder="High"
                  />
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={criticalRiskThreshold}
                    onChange={(e) => setCriticalRiskThreshold(Number(e.target.value))}
                    className="h-9 px-3 text-sm border border-border rounded-md"
                    placeholder="Critical"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={saveThresholds}
                  disabled={savingThresholds || isThresholdsLoading || isThresholdsError}
                  className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-60"
                >
                  {savingThresholds ? "Saving..." : t("alerts.saveThresholds")}
                </button>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="mt-1 w-full h-9 px-3 text-sm border border-border rounded-md disabled:opacity-60"
      />
    </div>
  );
}
