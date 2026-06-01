# Risk Register

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | **Data leakage** (PII in demo DB) | High | Low | Synthetic CSV only; anonymized case codes; no real names in models |
| R2 | **False-positive alerts** (missed session rule) | Medium | Medium | Configurable `missed_sessions_before_alert`; human acknowledges/dismisses |
| R3 | **False-negative** (risk not escalated) | High | Medium | Dashboard KPIs + alert list + referral workflow |
| R4 | **Unauthorized action** (wrong role) | High | Medium | API 403 + `AuditLog`; pytest permission tests |
| R5 | **Silent workflow failure** | Medium | Low | Structured logging; audit timeline; UI error toasts |
| R6 | **Over-interpretation of risk scores** | Medium | Medium | UI disclaimers; explainable alert text; no autonomous clinical decisions |
| R7 | **Stigmatizing youth labels** | Medium | Low | Awareness actions framed as supportive; non-disciplinary copy in UI |
| R8 | **Service outage / DB error** | Medium | Low | SQLite for prototype; README reproducible setup; tests on CI command |

## Operational escalation
1. Counselor reviews alert → acknowledge or escalate (referral).
2. Admin adjusts thresholds if systemic false positives.
3. Blocked actions visible in **Audit Log** with `result=Blocked` / `failure`.
