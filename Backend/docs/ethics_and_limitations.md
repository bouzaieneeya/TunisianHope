# Ethics, Data Governance, and Limitations

## Data ethics
- All records are **synthetic** or generated for demonstration.
- Case and youth identifiers use codes (`C-1042`, `Y-3001`), not legal names.
- No collection of real medical, psychological, or school records.
- Assumed consent is **simulated** for academic evaluation only.

## Access control
- Role-based permissions (operator, counselor, admin).
- Session authentication with CSRF on mutating API calls.
- Admin-only user management and system policies.

## Limitations (do not over-claim)
1. **Not a medical device** — does not diagnose or prescribe treatment.
2. **Rule-based risk** — scores and alerts are explainable thresholds, not clinical AI.
3. **Prototype database** — SQLite; not production-hardened for scale or HA.
4. **Single-region demo** — seeded data may not reflect full Tunisian diversity.
5. **Digital risk indicators** — proxy metrics only; require human interpretation.
6. **Language** — UI supports EN/FR/AR; backend messages partially in English/French.

## Responsible use
- Counselors must validate alerts before referral or family contact.
- Awareness actions must include a written rationale (enforced in API).
- Exports may be configured to anonymize fields (`SystemPolicy.anonymize_exports`).

## Exam note
This project implements **Scenario 2 (mental-health follow-up)** and **Scenario 3 (digital behavior support)** as the two end-to-end operational scenarios, per project scope agreed with the implementation plan.
