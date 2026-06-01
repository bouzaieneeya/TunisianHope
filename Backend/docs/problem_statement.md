# Problem Statement — Tunisian Hope

## Population
Children and youth aged **12–20** in Tunisian schools and youth centers (synthetic cohort only).

## Problem
- **Mental health (Scenario 2):** missed follow-up sessions and rising risk scores without timely counselor action.
- **Digital wellbeing (Scenario 3):** harmful screen-time and online-risk patterns without structured, non-punitive support.

## Decision makers
- **Operators** — intake and record updates.
- **Counselors (supervisors)** — validate cases, notes, referrals, awareness actions.
- **Admins** — thresholds, policies, user management, exports.

## Operational workflow (two scenarios)

### Scenario 2 — Mental health follow-up
1. Case intake (`POST /api/scenario2/cases/`).
2. Schedule sessions; mark attended/missed.
3. Missed-session rule triggers alerts (configurable threshold).
4. Counselor adds clinical notes, acknowledges alerts, triggers referral when needed.
5. Timeline and audit log record every action.

### Scenario 3 — Youth digital behavior support
1. Youth profile and digital assessments loaded from synthetic CSV.
2. Counselor records observations (`POST .../observations/`).
3. Preventive/informational awareness actions sent with mandatory rationale.
4. Risk monitor and awareness queue for prioritization.

## Expected value
Faster detection of disengagement and risk, traceable interventions, fewer silent workflow failures.

## Validation rules
- Unauthorized API actions → **403** + `AuditLog` with `result=failure`.
- Session `absent` count ≥ threshold → alert created (no duplicate active alert).
- Case status transitions follow `Case.ALLOWED_TRANSITIONS` (invalid transition logged and rejected).

## Data and ethics
- **Synthetic data only** — see `datasets/` and `docs/data_dictionary.md`.
- No real names, medical records, or identifiable minors.
- Platform is **decision support**, not a clinical diagnosis tool.
