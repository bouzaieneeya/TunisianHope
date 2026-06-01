# Tunisian Hope — Full Testing Guide

Use this document to verify the app before submission and to prepare for what the examiner may ask during the demo or defense.

**Scenarios in scope:** Scenario 2 (mental-health follow-up) + Scenario 3 (youth digital behavior).  
**Scenario 1 (education early-warning)** is intentionally **not** implemented — document this if asked.

---

## 0. Prerequisites

### Start both servers

**Terminal 1 — Backend** (`Backend/`):

```powershell
py -m pip install -r requirements.txt
py manage.py migrate
py manage.py load_demo_data
py manage.py runserver
```

**Terminal 2 — Frontend** (`Frontend/`):

```powershell
npm install
npm run dev
```

Open: **http://localhost:5173**

### Demo accounts

| Username | Password | Role in UI |
|----------|----------|------------|
| `operator_nour` | `Operator@123` | Operator |
| `counselor_sara` | `Counselor@123` | Counselor |
| `admin_karim` | `Admin@123` | Admin |

### Automated tests (run before Moodle upload)

```powershell
cd Backend
py -m pytest api/tests.py -v
```

Expected: **14 passed**.

---

## 1. What the teacher / examiner typically checks

| Exam requirement | Where to show it | Your evidence |
|------------------|------------------|---------------|
| **Two operational scenarios** (not only one) | S2 Cases + S3 Youth Profiles | Both flows below |
| **Synthetic datasets** (Step 3) | `Backend/datasets/*.csv` + `load_demo_data` | 4 CSV files + command |
| **Governance docs** | `Backend/docs/` | problem_statement, roles_matrix, state_machine, risk_register, ethics, data_dictionary |
| **RBAC / permissions** | Operator blocked actions + Audit Log | Section 4 |
| **Failure handling** (≥1 per scenario) | API 403/400/409 + Audit Log | Section 5 |
| **Audit trail** | Audit Log page + case timeline | Section 6 |
| **Advanced tracks (≥2)** | Tracks B + C | `Backend/docs/advanced_tracks.md` |
| **Working UI + API** | Live demo + pytest | This guide |
| **Tests** | Terminal pytest output | Screenshot |
| **Not required for your scope** | Scenario 1 screens | Say “out of scope by design” — see `ethics_and_limitations.md` |

---

## 2. Master checklist (tick when done)

### Auth & shell

- [ ] Login page loads
- [ ] Login as each of the 3 roles
- [ ] Logout works; protected routes redirect to `/login`
- [ ] Language switcher: EN / FR / AR (RTL for Arabic)
- [ ] Topbar search: type `C-1042` or `Y-3001` → navigate to detail
- [ ] Topbar notifications show active alerts

### Scenario 2 — Mental health follow-up

- [ ] **Dashboard** — KPIs load; adherence chart; upcoming appointments; alerts list
- [ ] **Cases** — list, filters, create new case (valid data)
- [ ] **Case detail** — timeline, add clinical note, tabs
- [ ] **Appointments** — schedule session, mark attended/missed, reminder
- [ ] **Alerts** — list, acknowledge (counselor), thresholds visible
- [ ] **Reports** — CSV download, PDF download
- [ ] **Audit Log** — entries after actions; filters work

### Scenario 3 — Digital behavior

- [ ] **Youth Profiles** — list, create profile, open detail
- [ ] **Youth detail** — observations, assessments, send awareness action (counselor)
- [ ] **Risk Monitor** — assign counselor (admin)
- [ ] **Awareness Actions** — queue, mark sent / log outcome / escalate

### Admin-only

- [ ] **Settings** — save policies (admin)
- [ ] **Users Management** — visible only as admin
- [ ] **Settings → Cycle failure scenario** (optional UI demo for oral defense)

### Failure & security evidence

- [ ] S2: Operator referral blocked (API) — Section 5.1
- [ ] S2: Malformed case intake (API) — Section 5.2
- [ ] S3: Operator cannot send awareness action (API) — Section 5.3
- [ ] S3: Assessment conflict on profile with 2 assessments in 24h — Section 5.4
- [ ] `py -m pytest api/tests.py -v` — all green

---

## 3. Step-by-step manual tests (by page)

### 3.1 Login (`/login`)

1. Enter `counselor_sara` / `Counselor@123` → land on Dashboard.
2. Logout → login as `operator_nour` / `Operator@123`.
3. Logout → login as `admin_karim` / `Admin@123`.

**Pass if:** No long delay on login; session persists on refresh.

---

### 3.2 Dashboard (`/dashboard`) — Counselor

1. Login as `counselor_sara`.
2. Check KPI cards (active cases, appointments, youth monitored, etc.).
3. Scroll **Adherence** line chart (from real sessions).
4. **Upcoming appointments** list links to cases.
5. Click **Acknowledge** on a “New” alert (if any).

**Pass if:** Data loads without “could not be loaded”; chart not empty after demo data loaded.

---

### 3.3 Cases (`/cases`) — Operator or Admin

1. Login as `operator_nour`.
2. Use search/filter on the list.
3. Click **Create case** → age `16`, region `Tunis`, center `Test School` → submit.
4. You should navigate to the new case detail.

**Pass if:** New case appears in list and in database (refresh page still shows it).

**Malformed intake test** (failure evidence):

1. Create case with age `99` or empty region/center.
2. Expect error toast with validation messages (not a silent failure).

---

### 3.4 Case detail (`/cases/C-1042`) — Counselor

1. Login as `counselor_sara`.
2. Open case **C-1042** (or any case from list).
3. **Add clinical note** → save → appears under Notes / timeline.
4. As counselor, **Trigger referral** with a reason → success toast; timeline updates.

**Operator note:** On case detail, **Trigger referral** shows a **client-side block** dialog for Operator (no API call). For API-level 403 + audit, use **Appointments** (Section 5.1).

---

### 3.5 Appointments (`/appointments`)

1. Login as `counselor_sara`.
2. **Schedule** a new session: pick a case from dropdown, date, save.
3. **Mark missed** on a session.
4. Go to **Alerts** — confirm a missed-session alert exists (may depend on thresholds).

**Operator referral block (important for exam):**

1. Login as `operator_nour`.
2. Find a row with **Trigger Referral** (after missed sessions).
3. Click it → expect **error toast** (403 from API).
4. Open **Audit Log** → blocked referral / failure entry.

---

### 3.6 Alerts (`/alerts`) — Counselor

1. Acknowledge an alert.
2. (Admin) try dismiss if available.

**Pass if:** Alert status changes; dashboard alert count decreases after refresh.

---

### 3.7 Youth Profiles (`/youth-profiles`)

1. Login as `operator_nour`.
2. Open **Y-3001**.
3. **Add observation** → text saved, visible on page.
4. Logout → login as `counselor_sara`.
5. On **Y-3001**, **Send awareness action** (preventive / online) → success.

**Pass if:** Observation and action persist after page reload.

---

### 3.8 Youth detail — Assessment conflict (`Y-3007`)

Seed data gives **Y-3007** two assessments within 24 hours.

1. Login as `counselor_sara`.
2. Open **Y-3007**.
3. Try **Send awareness action** again.
4. Expect error: assessment conflict (409).

5. Open **Audit Log** → filter/search “Assessment” or `Y-3007` → **Blocked** entry.

---

### 3.9 Awareness Actions (`/awareness-actions`) — Counselor

1. Mark an action **Sent**.
2. **Log outcome** or **Escalate** on another row.

**Pass if:** Status updates in table after refresh.

---

### 3.10 Risk Monitor (`/risk-monitor`) — Admin

1. Login as `admin_karim`.
2. **Assign counselor** on a high-risk youth row.

**Pass if:** Assignment saves; operator/counselor cannot access Users Management.

---

### 3.11 Reports (`/reports`)

1. Any logged-in role.
2. Download **CSV** → open file: rows for cases, youth, actions.
3. Download **PDF** → opens as real PDF (not `.txt`).

---

### 3.12 Audit Log (`/audit-log`)

1. After tests above, open Audit Log.
2. Filter by role **Operator**, result **Blocked**, domain **Digital** / **Follow-up**.
3. Confirm entries for: notes, referrals, awareness blocks, intake validation.

**Pass if:** No mock-only fake rows required — data comes from API (`/api/audit/logs/`).

---

### 3.13 Settings (`/settings`) — Admin

1. Toggle policies → **Save** → reload page → values kept.
2. **Cycle failure scenario** — cycles UI demo labels (optional for slides):
   - S2 malformed intake
   - S2 unauthorized referral
   - S2 missed-session cascade
   - S3 assessment conflict
   - S3 unauthorized action

Use this only as a **supplement** to real API failures in Section 5.

---

### 3.14 Users Management (`/users-management`) — Admin only

1. As admin → page loads.
2. As counselor → navigating to URL redirects to dashboard.

---

## 4. Role matrix — quick “who can do what” tests

| Action | Operator | Counselor | Admin |
|--------|:--------:|:---------:|:-----:|
| Create case | ✓ | ✓ | ✓ |
| Add note | ✓ | ✓ | ✓ |
| Schedule session | ✓ | ✓ | ✓ |
| Mark attended/missed | — | ✓ | ✓ |
| Trigger referral (API) | **✗** | ✓ | ✓ |
| Acknowledge alert | — | ✓ | ✓ |
| Send awareness action | **✗** | ✓ | ✓ |
| Assign counselor (youth) | — | — | ✓ |
| Save system policies | — | — | ✓ |
| Users management | — | — | ✓ |

Full matrix: `Backend/docs/roles_matrix.md`.

---

## 5. Failure scenarios (exam-critical)

### 5.1 S2 — Unauthorized referral (Operator)

**UI path (recommended):**

1. `operator_nour` → **Appointments** → **Trigger Referral** on eligible case.
2. Error toast; **Audit Log** shows blocked action for that case.

**Automated proof:**

```powershell
py -m pytest api/tests.py::ScenarioApiTests::test_s2_referral_blocked_for_operator -v
```

---

### 5.2 S2 — Malformed intake

**UI path:**

1. `operator_nour` → **Cases** → Create with age `99` or missing region.
2. Validation error toast.

**Automated proof:**

```powershell
py -m pytest api/tests.py::ScenarioApiTests::test_malformed_case_intake_returns_400_and_audit -v
```

---

### 5.3 S3 — Unauthorized awareness action (Operator)

**UI path:**

1. `operator_nour` → **Youth Profiles** → **Y-3001** → try send awareness action (if button shown)  
   OR use **Awareness Actions** send flow.
2. Expect 403 / error message.
3. **Audit Log** → Digital domain, Blocked, “Send awareness action”.

**Automated proof:**

```powershell
py -m pytest api/tests.py::ScenarioApiTests::test_s3_operator_block_writes_platform_audit -v
```

---

### 5.4 S3 — Assessment conflict

**UI path:**

1. `counselor_sara` → **Y-3007** → send awareness action.
2. Expect conflict error (duplicate assessments within 24h).

**Automated proof:**

```powershell
py -m pytest api/tests.py::ScenarioApiTests::test_s3_assessment_conflict_returns_409 -v
```

---

## 6. Data persistence (what is saved where)

| User action | Stored in |
|-------------|-----------|
| Login session | Django session (cookie) |
| Clinical notes | DB + case `AuditLog` |
| Sessions / appointments | DB (`workflows.Session`) |
| Alerts | DB (`workflows.Alert`) |
| Youth observations | DB (`api.YouthObservation`) |
| Awareness actions | DB (`api.AwarenessAction`) |
| Platform-wide blocks | DB (`api.PlatformAuditLog`) |
| Policies | DB (`api.SystemPolicy`) |
| UI language | `localStorage` (i18n only) |

Notes are **not** stored in `localStorage` — they are API-backed.

---

## 7. API smoke tests (optional, for technical questions)

Base URL: `http://127.0.0.1:8000/api/`

After browser login, or use session from DevTools:

| Endpoint | Method | Role |
|----------|--------|------|
| `/auth/me/` | GET | any |
| `/scenario2/dashboard/` | GET | any |
| `/scenario2/cases/` | GET/POST | operator+ |
| `/scenario2/cases/{id}/notes/` | POST | any |
| `/scenario2/cases/{id}/referral/` | POST | counselor+ only |
| `/scenario3/profiles/` | GET/POST | any |
| `/scenario3/actions/send/` | POST | counselor+ only |
| `/audit/logs/` | GET | any |
| `/search/?q=C-1042` | GET | any |
| `/reports/export/?format=pdf` | GET | any |

Full routes: `Backend/api/urls.py`.

---

## 8. Five-minute oral demo script

1. **Counselor** login → Dashboard (KPIs + chart + alert acknowledge).
2. **Cases** → C-1042 → add note.
3. **Appointments** → schedule → mark missed → **Alerts**.
4. **Youth** → Y-3001 → observation → send awareness action.
5. **Audit Log** → show success entries.
6. **Operator** login → Appointments → **Trigger Referral** → blocked → Audit Log.
7. **Counselor** → Y-3007 → send action → conflict → Audit Log.
8. **Reports** → CSV + PDF.
9. Terminal: `py -m pytest api/tests.py -v`.

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| `no such table: api_youthobservation` | `py manage.py migrate api` |
| Empty cases/youth lists | `py manage.py load_demo_data` |
| API 404 from frontend | Backend running on `:8000`; frontend `npm run dev` |
| Login very slow | Restart backend (demo users no longer re-hashed every login) |
| PDF download is text | Install `reportlab`: `py -m pip install -r requirements.txt` |
| CORS / CSRF errors | Use `localhost:5173`, not file:// |

---

## 10. Screenshot list for your report

Capture these for Moodle / slides:

1. Login (3 roles — 3 screenshots or one collage)
2. Dashboard (counselor)
3. Case detail + note added
4. Appointments + missed session + alert
5. Operator referral blocked + Audit Log
6. Youth profile + observation + awareness action
7. Y-3007 assessment conflict + Audit Log
8. Reports CSV + PDF
9. Settings policies (admin)
10. Terminal pytest 14 passed
11. `Backend/docs/` folder tree (governance)
12. `Backend/datasets/` CSV files

---

*Related: [MOODLE_DELIVERABLES.md](./MOODLE_DELIVERABLES.md) · [SUBMISSION.md](./SUBMISSION.md)*
