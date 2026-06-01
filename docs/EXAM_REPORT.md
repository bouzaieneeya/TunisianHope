# Tunisian Hope — Youth Support Platform  
## Exam Project Report (Python Web Programming — Django)

---

**Course:** Python Web Programming (Django)  
**Institution:** SESAME University  
**Instructor:** Chaouki Bayoudhi  
**Academic year:** 2025–2026  

**Student name:** *[YOUR FULL NAME]*  
**Student ID / Group:** *[YOUR ID / GROUP]*  
**Submission date:** *[DD Month YYYY]*  

**Project title:** Tunisian Hope and Future for Children and Youth — Web Platform for Mental-Health Follow-Up and Digital Wellbeing Support  

**Repository / ZIP:** `TunisianHope/` (Django backend + React frontend)

---

> **How to turn this into the PDF for Moodle**  
> 1. Open this file in **Word**, **Google Docs**, or **Typora**.  
> 2. Replace every *[placeholder]* with your personal details.  
> 3. Insert your **screenshots** in Section 12 (Appendix) — see `docs/MOODLE_DELIVERABLES.md` for the list.  
> 4. Export as PDF: `Bayoudhi_[YourName]_TunisianHope_Report.pdf`  
> 5. Upload with source ZIP and slides per Moodle instructions.

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [Alignment with exam requirements](#2-alignment-with-exam-requirements)  
3. [Problem statement](#3-problem-statement)  
4. [Scenarios implemented](#4-scenarios-implemented)  
5. [Definition of done](#5-definition-of-done)  
6. [System architecture](#6-system-architecture)  
7. [Roles, security, and governance](#7-roles-security-and-governance)  
8. [Workflow and state machines](#8-workflow-and-state-machines)  
9. [Failure handling and recovery](#9-failure-handling-and-recovery)  
10. [Graphical user interface and monitoring](#10-graphical-user-interface-and-monitoring)  
11. [Synthetic datasets](#11-synthetic-datasets)  
12. [Advanced tracks](#12-advanced-tracks)  
13. [Risk register](#13-risk-register)  
14. [Testing, metrics, and reproducibility](#14-testing-metrics-and-reproducibility)  
15. [Installation and user guide](#15-installation-and-user-guide)  
16. [Ethics, limitations, and responsible use](#16-ethics-limitations-and-responsible-use)  
17. [Self-assessment against rubric](#17-self-assessment-against-rubric)  
18. [Appendix — evidence screenshots](#18-appendix--evidence-screenshots)  
19. [References](#19-references)

---

## 1. Executive summary

This project delivers **Tunisian Hope**, a full-stack web platform that helps an NGO-style organization support Tunisian youth (ages 12–20) through structured workflows for **mental-health follow-up** and **digital wellbeing**, using **synthetic data only**.

The solution combines:

- **Backend:** Django 6 + Django REST Framework, SQLite, session authentication, role-based API enforcement, audit logging.  
- **Frontend:** React 18 + TypeScript + Vite, operational dashboard, case/youth management, alerts, reports, and audit views.  
- **Evidence:** 14 automated API tests, reproducible README setup, governance documentation under `Backend/docs/`, and four CSV datasets loaded via `py manage.py load_demo_data`.

**Scope choice:** The exam brief describes three scenario families. This submission implements **two end-to-end operational scenarios** as required by the minimum scope:

| Scenario | Exam topic | Status in this project |
|----------|------------|-------------------------|
| **Scenario 2** | Health / mental-health follow-up | **Fully implemented** |
| **Scenario 3** | Youth digital behavior support | **Fully implemented** |
| **Scenario 1** | Education early warning | **Not implemented** (documented omission; see Section 4.3) |

The platform is **decision support**, not a medical device: counselors and admins validate alerts and referrals; the system logs who did what and blocks unsafe role actions.

---

## 2. Alignment with exam requirements

The following table maps **mandatory deliverables** (Exam PDF, Section 4) to **concrete evidence** in this submission.

| Exam requirement | How we satisfy it | Evidence |
|------------------|-------------------|----------|
| Complete Django platform, ≥3 roles | Operator, Counselor, Admin across API + UI | `Backend/docs/roles_matrix.md`, demo accounts |
| ≥2 operational scenarios end-to-end | Scenario 2 + Scenario 3 | Sections 4.1–4.2, screenshots |
| ≥1 failure case **per scenario** | S2: referral 403, intake 400; S3: action 403, assessment 409 | Section 9, pytest, Audit Log |
| Dashboard / decision-support GUI | Dashboard, cases, alerts, reports | Section 10, screenshots |
| Automated tests + reproducibility | `pytest` + README | Section 14 |
| Synthetic / open data only | CSV datasets + data dictionary | Section 11 |
| Governance + risk + ethics | `Backend/docs/` | Sections 13, 16 |
| Submission package | ZIP + this report + slides + screenshots | Moodle upload |

**Advanced tracks (≥2):** Track **B** (security & privacy) and Track **C** (API & integration quality) — Section 12.

---

## 3. Problem statement

*Source: `Backend/docs/problem_statement.md` — expanded to match exam Task clarity (PDF Section 3).*

### 3.1 Population

Children and youth aged **12–20** in Tunisian schools and youth centers, represented by **synthetic cohorts** only (case codes `C-xxxx`, profile codes `Y-xxxx`).

### 3.2 Problem

1. **Mental health (Scenario 2):** Missed follow-up sessions and rising risk indicators without timely counselor action.  
2. **Digital wellbeing (Scenario 3):** Harmful screen-time and online-risk patterns without structured, **non-punitive** awareness and referral pathways.

### 3.3 Decision makers

| Role | Responsibility |
|------|----------------|
| **Operator** | Intake, record updates, scheduling support |
| **Counselor (supervisor)** | Clinical notes, session outcomes, alerts, referrals, awareness actions |
| **Admin** | Policies, thresholds, user management, exports, counselor assignment |

### 3.4 Operational workflow (summary)

**Scenario 2:** Case intake → schedule sessions → mark attended/missed → threshold-based alerts → notes & referral → timeline + audit.  

**Scenario 3:** Youth profile + digital assessments → observations → counselor sends awareness action with mandatory rationale → risk monitor & action queue.

### 3.5 Expected value

- Faster detection of disengagement and risk.  
- Traceable interventions (who, when, what).  
- Fewer silent workflow failures (blocked actions logged, UI errors shown).

### 3.6 Validation rules

| Rule | Behavior |
|------|----------|
| Unauthorized API action | HTTP **403** + audit entry with reason |
| Malformed case intake | HTTP **400** + validation errors + platform audit |
| Duplicate assessment (24h) | HTTP **409** on awareness send + audit |
| Missed sessions ≥ threshold | Alert created; no duplicate active alert for same rule |
| Invalid case status transition | Rejected + failure logged (`Case.ALLOWED_TRANSITIONS`) |

### 3.7 Data and ethics boundary

- **Synthetic data only** — no real names, medical records, or identifiable minors.  
- Documented in `Backend/docs/ethics_and_limitations.md` and `Backend/docs/data_dictionary.md`.

---

## 4. Scenarios implemented

### 4.1 Scenario 2 — Health / mental-health follow-up

**Context (exam):** Synthetic follow-up records: appointments, indicators, missed sessions.  
**Goal:** Track adherence; trigger referral/reminder workflow.

| Exam minimum criterion | Implementation |
|------------------------|----------------|
| Missed follow-up triggers logged reminder/referral | `Session` status `absent` + `RiskThresholdConfig.missed_sessions_before_alert` → `Alert`; reminder API on case |
| Case timeline: who, when, what | `GET /api/scenario2/cases/{id}/timeline/` + `AuditLog` |
| Unauthorized role blocked and logged | Operator referral → **403** + `AuditLog` / `PlatformAuditLog` |

**Demo path (5 min):**

1. Login as `counselor_sara` → **Cases** → open `C-1042` → add clinical note.  
2. **Appointments** → schedule session → mark **missed** → **Alerts** → acknowledge.  
3. **Audit Log** → verify entries.

**Failure evidence (Scenario 2):**

| Failure | Trigger | Expected result |
|---------|---------|-----------------|
| Unauthorized referral | `operator_nour` → **Appointments** → Trigger Referral | Error toast; Audit Log “Blocked” |
| Malformed intake | Create case with age 99 or empty region | HTTP 400; validation message |

### 4.2 Scenario 3 — Youth digital behavior support

**Context (exam):** Optional in brief; implemented as second full scenario.  
**Goal:** Awareness and preventive actions linked to digital habits; non-punitive logic (rationale required).

| Feature | Implementation |
|---------|----------------|
| Youth profiles & assessments | `YouthProfile`, `DigitalAssessment`, CSV load |
| Observations | `POST /api/scenario3/profiles/{code}/observations/` |
| Awareness actions | `POST /api/scenario3/actions/send/` (counselor/admin only) |
| Risk prioritization | **Risk Monitor**, **Awareness Actions** pages |

**Demo path:**

1. `counselor_sara` → **Youth Profiles** → `Y-3001` → add observation → send awareness action.  
2. **Awareness Actions** → update status (sent / outcome / escalate).

**Failure evidence (Scenario 3):**

| Failure | Trigger | Expected result |
|---------|---------|-----------------|
| Operator sends action | `operator_nour` → send awareness on valid profile | **403** + platform audit |
| Assessment conflict | `counselor_sara` → `Y-3007` (2 assessments in 24h) → send action | **409** + audit “Assessment ingest” |

### 4.3 Scenario 1 — Education early warning (not implemented)

**Reason for omission:** Project scope prioritizes **depth on two youth-support domains** (clinical follow-up + digital wellbeing) that match the NGO framing, within the exam’s minimum requirement of **two** scenarios. Scenario 1 (attendance/grades early warning) would duplicate dashboard patterns without adding new governance evidence.

**Mitigation for evaluators:**

- All **mandatory** items (2 scenarios, failures, roles, tests, GUI, datasets) are met via Scenarios 2 and 3.  
- Documented explicitly in `Backend/docs/ethics_and_limitations.md`.  
- Optional future work: school attendance module sharing the same case/alert engine.

---

## 5. Definition of done

Per exam PDF Section 3 (“What done means”), a reviewer must be able to:

| Criterion | Status | How to verify |
|-----------|--------|---------------|
| Run system from README | ✓ | Section 15; `py manage.py migrate`, `load_demo_data`, `runserver` + `npm run dev` |
| Execute **two** complete scenarios | ✓ | Sections 4.1–4.2 |
| Observe ≥1 failure per scenario + safe recovery | ✓ | Section 9; no data corruption on 403/400/409 |
| Permissions, validation, audit enforced | ✓ | Section 7; Audit Log UI + pytest |

---

## 6. System architecture

### 6.1 Logical layers (exam Section 7)

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation — React SPA (Vite, TypeScript)                │
│  Pages: Dashboard, Cases, Appointments, Alerts, Youth, …    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS /api/* (dev proxy :5173→:8000)
┌───────────────────────────▼─────────────────────────────────┐
│  API — Django REST Framework (session auth, CSRF)           │
│  Backend/api/views.py, serializers.py, urls.py              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Domain apps                                                │
│  • accounts — custom User (operator, supervisor, admin)     │
│  • cases — Case, AuditLog                                   │
│  • workflows — Session, Alert, RiskThresholdConfig          │
│  • api — YouthProfile, assessments, observations, policies  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  SQLite (prototype) + CSV loader (datasets/)                │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Technology stack

| Layer | Technology |
|-------|------------|
| Backend | Django 6, DRF, SQLite |
| Frontend | React, TypeScript, Vite, TanStack Query |
| Auth | Django sessions + `IsAuthenticated`; CSRF on mutations |
| Tests | pytest, pytest-django |
| Reports | CSV + PDF (ReportLab) |
| i18n | English, French, Arabic (UI) |

### 6.3 Project structure

| Path | Purpose |
|------|---------|
| `Backend/api/` | REST endpoints, platform audit, search |
| `Backend/cases/` | Mental-health case model & case-scoped audit |
| `Backend/workflows/` | Sessions, alerts, thresholds |
| `Backend/accounts/` | User roles |
| `Backend/datasets/` | Synthetic CSV + `load_datasets.py` |
| `Backend/docs/` | Governance artifacts (exam Week 1 deliverables) |
| `Frontend/src/` | SPA pages and API client (`lib/api.ts`) |
| `docs/` | Testing guide, Moodle guide, this report |

### 6.4 Key API endpoints (sample)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/login/` | Session login |
| `GET /api/scenario2/dashboard/` | KPIs, adherence, alerts |
| `GET/POST /api/scenario2/cases/` | List / create cases |
| `POST /api/scenario2/cases/{id}/referral/` | Referral (counselor+) |
| `GET /api/scenario2/alerts/` | Active alerts |
| `GET/POST /api/scenario3/profiles/` | Youth profiles |
| `POST /api/scenario3/actions/send/` | Awareness actions |
| `GET /api/audit/logs/` | Unified audit view |
| `GET /api/search/?q=` | Global search |
| `GET /api/reports/export/?format=csv\|pdf` | Exports |

Full list: `Backend/api/urls.py`.

---

## 7. Roles, security, and governance

### 7.1 Permissions matrix

| Action | Operator | Counselor | Admin |
|--------|:--------:|:---------:|:-----:|
| Login / dashboard | ✓ | ✓ | ✓ |
| Create case / youth profile | ✓ | ✓ | ✓ |
| Add note / observation | ✓ | ✓ | ✓ |
| Schedule session | ✓ | ✓ | ✓ |
| Mark attended / missed | — | ✓ | ✓ |
| Trigger referral | — | ✓ | ✓ |
| Acknowledge alert | — | ✓ | ✓ |
| Send awareness action | — | ✓ | ✓ |
| Assign counselor (youth) | — | — | ✓ |
| System policies / users | — | — | ✓ |
| Export reports | ✓ | ✓ | ✓ |

*Full matrix: `Backend/docs/roles_matrix.md`.*

### 7.2 Security controls

- **Authentication:** Django session; demo users seeded on login (`_ensure_demo_users`).  
- **Authorization:** Per-view role checks in `api/views.py` (`_role_from_request`, `_forbidden`, `_is_admin`).  
- **CSRF:** Enabled for mutating requests; frontend sends `X-CSRFToken` from login response.  
- **Audit:** `cases.AuditLog` (per case) + `api.PlatformAuditLog` (cross-domain blocks).  
- **Privacy:** Synthetic codes only; optional `SystemPolicy.anonymize_exports`.

### 7.3 Governance documents delivered

| Document | Location |
|----------|----------|
| Problem statement | `Backend/docs/problem_statement.md` |
| Roles matrix | `Backend/docs/roles_matrix.md` |
| State machine | `Backend/docs/state_machine.md` |
| Risk register | `Backend/docs/risk_register.md` |
| Ethics & limitations | `Backend/docs/ethics_and_limitations.md` |
| Data dictionary | `Backend/docs/data_dictionary.md` |
| Advanced tracks | `Backend/docs/advanced_tracks.md` |

---

## 8. Workflow and state machines

### 8.1 Case status (Scenario 2)

```
new → in_review → active | closed
active → followup
followup → alert | closed
alert → followup | closed
closed (terminal)
```

Invalid transitions are rejected and logged. Referral workflow can set status to `alert`.

*Detail: `Backend/docs/state_machine.md`.*

### 8.2 Session status

`scheduled` → `present` | `absent` | `cancelled`  

`absent` contributes to missed-session count; when count ≥ configured threshold, an **Alert** is created (deduplicated).

### 8.3 Youth profile & awareness actions

- Profile: `active` | `pending_review` | `closed`  
- Awareness: `pending` → `sent` → `acknowledged` | `escalated` | `no_response`

---

## 9. Failure handling and recovery

Exam requirement: **at least one controlled failure per scenario** with safe recovery (no corrupt state).

### 9.1 Scenario 2 failures

| ID | Injection | HTTP | Audit | Recovery |
|----|-----------|------|-------|----------|
| F2.1 | Operator triggers referral | 403 | Case `AuditLog` + platform log | User sees error; case unchanged |
| F2.2 | Intake age 99 / missing region | 400 | Platform audit “Intake validation” | User corrects form; no partial case |

**UI:** Operator referral via **Appointments → Trigger Referral**.  
**Automated:** `test_s2_referral_blocked_for_operator`, `test_malformed_case_intake_returns_400_and_audit`.

### 9.2 Scenario 3 failures

| ID | Injection | HTTP | Audit | Recovery |
|----|-----------|------|-------|----------|
| F3.1 | Operator sends awareness action | 403 | Platform audit | No action row created |
| F3.2 | Send action on Y-3007 (2 assessments / 24h) | 409 | Platform audit “Assessment ingest” | Counselor reviews assessments first |

**Automated:** `test_s3_operator_block_writes_platform_audit`, `test_s3_assessment_conflict_returns_409`.

### 9.3 Safe recovery principles

- Failed mutations do **not** persist partial domain records.  
- Errors return structured JSON (`detail`, `errors`).  
- **Audit Log** UI shows success and blocked actions for examiner review.

*[INSERT SCREENSHOT: Operator referral blocked — file: 06-operator-referral-blocked.png]*  

*[INSERT SCREENSHOT: Audit Log blocked entries — file: 07-audit-log-blocked.png]*  

*[INSERT SCREENSHOT: Y-3007 assessment conflict — file: 10-assessment-conflict.png]*

---

## 10. Graphical user interface and monitoring

Exam Section 11 requires decision-oriented GUI with intake, filters, timeline, dashboard, exports, and action logging.

| Requirement | Screen / feature |
|-------------|------------------|
| Case intake & validation | **Cases** → Create case dialog |
| Case list + filters | **Cases** (status, risk, counselor) |
| Detail + timeline | **Case detail**, **Youth detail** |
| Dashboard KPIs & alerts | **Dashboard** |
| Exports | **Reports** (CSV + PDF) |
| Monitoring logs | **Audit Log** (role, timestamp, result, reason) |
| Global search | Top bar search → cases / youth |
| Notifications | Top bar bell → active alerts |

**Languages:** EN / FR / AR (RTL) via language switcher.

**Status clarity:** Badges for case status, alert status, appointment status, risk level.

*[INSERT SCREENSHOT: Dashboard — file: 02-dashboard-counselor.png]*  

*[INSERT SCREENSHOT: Case with note — file: 03-case-note.png]*  

*[INSERT SCREENSHOT: Reports export — file: 11-reports-csv-pdf.png]*

---

## 11. Synthetic datasets

### 11.1 Primary CSV files (loaded into database)

| File | Scenario | Content |
|------|----------|---------|
| `mental_health_cases.csv` | 2 | Cases: age, region, risk, status |
| `followup_sessions.csv` | 2 | Sessions: dates, present/absent |
| `youth_digital_profiles.csv` | 3 | Youth profiles |
| `awareness_actions.csv` | 3 | Awareness queue seed |

**Loader command:**

```powershell
cd Backend
py manage.py load_demo_data
```

**Dictionary:** `Backend/docs/data_dictionary.md`.

### 11.2 Supplementary data

Additional research-style CSVs under `Backend/datasets/data/` and `data_cleaned/` support exploration (`previewdata.py`); they are **not** required to run the main demo.

### 11.3 Provenance

- Generated for the SESAME exam project.  
- **Not** derived from real students or patients.  
- Identifiers are codes (`C-1042`, `Y-3001`), not legal names.

*[INSERT SCREENSHOT: datasets folder — file: 15-datasets.png]*

---

## 12. Advanced tracks

Exam requires **at least two** advanced tracks. This project documents:

### Track B — Security and privacy by design

- Custom roles on `User` model.  
- Endpoint-level permission gates + 403 responses.  
- Dual audit trail (case + platform).  
- CSRF + session cookies.  
- Synthetic-only data policy.  
- Tests: `test_s2_referral_blocked_for_operator`, `test_s3_operator_block_writes_platform_audit`.

### Track C — API and integration quality

- REST API with DRF serializers and validation.  
- React SPA integrated via `Frontend/src/lib/api.ts` and Vite proxy.  
- Structured errors: 400 / 403 / 409.  
- Contract tests in `Backend/api/tests.py` (14 tests).

### Track D — Observability (partial)

- Audit Log UI; Django logging in settings.  
- Dashboard KPIs and alert summaries.

### Not implemented (optional per exam)

- Web scraping pipeline (Section 12 PDF).  
- LLM / RAG / MCP agents (Sections 14–15 PDF) — omitted to keep mandatory flows stable and auditable without non-cited AI outputs.

*Detail: `Backend/docs/advanced_tracks.md`.*

---

## 13. Risk register

Summary of `Backend/docs/risk_register.md`:

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Data leakage | Synthetic CSV only; coded identifiers |
| R2 | False-positive alerts | Configurable threshold; human acknowledge/dismiss |
| R3 | False-negative (missed risk) | Dashboard KPIs + alert list + referral |
| R4 | Unauthorized action | API 403 + audit + pytest |
| R5 | Silent failure | Toasts + audit log + platform audit |
| R6 | Over-interpretation of scores | Explainable alert text; disclaimers |
| R7 | Stigmatizing labels | Supportive UI copy; rationale required for actions |
| R8 | Service / DB outage | README reproducibility; SQLite for prototype |

**Escalation:** Counselor acknowledges or escalates → admin adjusts thresholds if needed.

---

## 14. Testing, metrics, and reproducibility

### 14.1 Automated tests

From `Backend/`:

```powershell
py -m pytest api/tests.py -v
```

**Result:** 14 tests passed (dashboard, referral block, alerts, timeline, notes, observations, intake validation, platform audit, assessment conflict, global search, adherence fields).

| Test | Validates |
|------|-----------|
| `test_s2_dashboard_available` | Dashboard API |
| `test_s2_referral_blocked_for_operator` | S2 failure + AuditLog |
| `test_s3_action_blocked_for_operator` | S3 403 |
| `test_s3_operator_block_writes_platform_audit` | Platform audit |
| `test_s3_assessment_conflict_returns_409` | S3 failure |
| `test_malformed_case_intake_returns_400_and_audit` | S2 validation |
| `test_absent_session_triggers_alert` | Alert rule |
| `test_no_duplicate_alerts` | Dedup logic |
| `test_case_timeline_logs_actions` | Timeline |
| `test_case_add_note_persists` | Notes + audit |
| `test_youth_add_observation_persists` | Observations |
| `test_global_search_finds_case` | Search API |
| `test_dashboard_includes_adherence_and_sessions` | Dashboard fields |

*[INSERT SCREENSHOT: pytest 14 passed — file: 13-pytest-passed.png]*

### 14.2 Evaluation metrics (exam Section 10)

| Metric | How measured in this project |
|--------|------------------------------|
| Workflow completion rate | Cases progressed through sessions → alerts → acknowledgment in demo |
| Data validation pass rate | 400 on bad intake; serializer validation on API |
| Alert precision proxy | Explainable alert text (missed session rule); human acknowledgment |
| Recovery effectiveness | 403/409 leave DB consistent; tests assert no unwanted rows |
| Security checks coverage | Permission tests in pytest |
| UI usability evidence | Screenshots + role-based demo script (`docs/TESTING_GUIDE.md`) |
| Reproducibility | README + migrate + load_demo_data + pytest |

### 14.3 Manual test documentation

Full page-by-page checklist: **`docs/TESTING_GUIDE.md`**.

---

## 15. Installation and user guide

### 15.1 Prerequisites

- Python 3.11+ (project tested on 3.14)  
- Node.js 18+ for frontend

### 15.2 Backend

```powershell
cd Backend
py -m pip install -r requirements.txt
py manage.py migrate
py manage.py load_demo_data
py manage.py runserver
```

API base: `http://127.0.0.1:8000/api/`

### 15.3 Frontend

```powershell
cd Frontend
npm install
npm run dev
```

UI: `http://localhost:5173` (proxies `/api` to Django)

### 15.4 Demo accounts

| Username | Password | Role |
|----------|----------|------|
| `operator_nour` | `Operator@123` | Operator |
| `counselor_sara` | `Counselor@123` | Counselor |
| `admin_karim` | `Admin@123` | Admin |

### 15.5 Five-minute demo script

1. Counselor → Dashboard → Cases → C-1042 → note.  
2. Appointments → schedule → missed → Alerts → acknowledge.  
3. Youth Y-3001 → observation → awareness action.  
4. Audit Log.  
5. Operator → Appointments → referral blocked.  
6. Counselor → Y-3007 → conflict.  
7. Reports CSV/PDF.  
8. Show pytest output.

*Full script: `docs/SUBMISSION.md`, `docs/TESTING_GUIDE.md` Section 8.*

---

## 16. Ethics, limitations, and responsible use

### 16.1 Ethics

- All records are **synthetic** or generated for demonstration.  
- No real medical, psychological, or school records.  
- Simulated consent for academic evaluation only.  
- Role-based access; admin-only sensitive configuration.

### 16.2 Limitations (do not over-claim)

1. **Not a medical device** — does not diagnose or prescribe.  
2. **Rule-based risk** — thresholds, not clinical AI.  
3. **SQLite prototype** — not production scale/HA.  
4. **Single-region demo** — seeded data may not reflect all Tunisia.  
5. **Digital risk** — proxy metrics; human interpretation required.  
6. **Scenario 1** not implemented — see Section 4.3.

### 16.3 Responsible use

- Counselors validate alerts before referral or family contact.  
- Awareness actions require written rationale (API enforced).  
- Exports may anonymize fields per system policy.

*Full text: `Backend/docs/ethics_and_limitations.md`.*

---

## 17. Self-assessment against rubric

Exam PDF Section 17 — indicative mapping:

| Rubric area | Weight | Self-assessment | Evidence |
|-------------|--------|-----------------|----------|
| Problem framing & social relevance | 20% | Strong | Sections 3–4, NGO framing, Tunisia youth focus |
| Architecture & implementation | 25% | Strong | Section 6, full stack, two scenarios |
| Security, privacy, governance | 20% | Strong | Section 7, 13, docs/, audit |
| Validation (tests, failures, reproducibility) | 20% | Strong | Section 9, 14, 14 pytest tests |
| Communication (report, demo, slides) | 15% | *[Complete after slides]* | This report + screenshots + oral demo |

**Honest gaps for Q&A:**

- Scenario 1 not built (by scope).  
- No LLM/RAG (optional tracks skipped).  
- No production deployment / scraping track.

---

## 18. Appendix — evidence screenshots

Insert images in order with **captions**. Suggested files from `docs/MOODLE_DELIVERABLES.md`:

| # | Caption | File |
|---|---------|------|
| 1 | Login page | `01-login.png` |
| 2 | Dashboard (counselor) | `02-dashboard-counselor.png` |
| 3 | Case detail with clinical note | `03-case-note.png` |
| 4 | Appointments — missed session | `04-appointments-missed.png` |
| 5 | Alerts list | `05-alerts.png` |
| 6 | Operator referral blocked | `06-operator-referral-blocked.png` |
| 7 | Audit Log — blocked actions | `07-audit-log-blocked.png` |
| 8 | Youth observation on Y-3001 | `08-youth-observation.png` |
| 9 | Awareness action sent | `09-awareness-action.png` |
| 10 | Assessment conflict on Y-3007 | `10-assessment-conflict.png` |
| 11 | Reports CSV and PDF | `11-reports-csv-pdf.png` |
| 12 | Admin policies (Settings) | `12-settings-policies.png` |
| 13 | pytest — 14 passed | `13-pytest-passed.png` |
| 14 | Governance docs folder | `14-docs-folder.png` |
| 15 | Datasets CSV files | `15-datasets.png` |

*[Paste screenshots below or attach as pages in Word/PDF export]*

---

### Figure 1 — Login

*[IMAGE PLACEHOLDER]*

### Figure 2 — Dashboard

*[IMAGE PLACEHOLDER]*

### Figure 3 — Scenario 2 case workflow

*[IMAGE PLACEHOLDER]*

### Figure 4 — Scenario 2 failure (operator referral)

*[IMAGE PLACEHOLDER]*

### Figure 5 — Scenario 3 youth workflow

*[IMAGE PLACEHOLDER]*

### Figure 6 — Scenario 3 failure (assessment conflict)

*[IMAGE PLACEHOLDER]*

### Figure 7 — Audit Log

*[IMAGE PLACEHOLDER]*

### Figure 8 — Automated tests

*[IMAGE PLACEHOLDER]*

---

## 19. References

1. Chaouki Bayoudhi, *Exam Project — Python Web Programming (Django)*, SESAME University, 2025–2026.  
2. Django documentation: https://docs.djangoproject.com/  
3. Django REST Framework: https://www.django-rest-framework.org/  
4. Project repository: `TunisianHope/` (submitted ZIP).  
5. Internal docs: `Backend/docs/`, `docs/TESTING_GUIDE.md`, `docs/MOODLE_DELIVERABLES.md`.

---

**Declaration:** I certify that this exam project is my individual work, that external sources are cited where used, and that I can explain every component of the submission during oral defense.

**Signature:** _________________________  
**Date:** _________________________

---

*End of report*
