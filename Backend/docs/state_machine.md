# Case Status State Machine (Scenario 2)

Defined in `cases.models.Case.ALLOWED_TRANSITIONS`:

```
new ──────────────► in_review
in_review ────────► active | closed
active ───────────► followup
followup ─────────► alert | closed
alert ────────────► followup | closed
closed ───────────► (terminal)
```

## Transition rules
- `Case.transition_to(new_status, actor, reason)` validates allowed edges.
- Invalid transition → `ValueError` + `AuditLog` with `result=failure`.
- Referral workflow sets status to `alert` via API (`scenario2_trigger_referral`).

## Session statuses (`workflows.Session`)
- `scheduled` → `present` | `absent` | `cancelled`
- `absent` may auto-create `Alert` when missed count ≥ `RiskThresholdConfig.missed_sessions_before_alert`

## Youth profile statuses (Scenario 3)
- `active` | `pending_review` | `closed` (field on `api.YouthProfile`)

## Awareness action statuses
- `pending` → `sent` → `acknowledged` | `escalated` | `no_response`
