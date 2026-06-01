# Moodle Deliverables — Step-by-Step Guide

**Project:** Tunisian Hope and Future for Children and Youth  
**Course:** Python Web Programming (Django) — Chaouki Bayoudhi, SESAME 2025–2026  
**Your scope:** Scenario 2 + Scenario 3 (not Scenario 1)

Follow this guide in order. Allow **2–3 hours** for screenshots, slides, and zip packaging.

---

## Overview — what Moodle usually expects

Typical submission package (confirm exact labels on your Moodle course page):

| # | Deliverable | What you submit |
|---|-------------|-----------------|
| 1 | **Source code** | Zip of project (Backend + Frontend + docs) |
| 2 | **Short report / PDF** | Problem, architecture, scenarios, tests, screenshots |
| 3 | **Slides** | 5–10 min presentation |
| 4 | **Evidence** | Screenshots of working app + pytest output |
| 5 | **Optional** | Demo video link |

Your repo already includes governance docs under `Backend/docs/` and testing guides under `docs/`.

---

## Phase A — Prepare the project (30 min)

### Step A1 — Verify everything works

```powershell
cd C:\Users\eyabo\Desktop\TunisianHope\Backend
py -m pip install -r requirements.txt
py manage.py migrate
py manage.py load_demo_data
py -m pytest api/tests.py -v
```

All **14 tests** must pass. Screenshot the terminal (you will paste this into the report).

### Step A2 — Run the app for screenshots

**Terminal 1:**

```powershell
cd Backend
py manage.py runserver
```

**Terminal 2:**

```powershell
cd Frontend
npm run dev
```

Open **http://localhost:5173** in Chrome or Edge (full window, 1920×1080 if possible).

### Step A3 — Complete manual testing

Use **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** and tick every box in Section 2 before taking screenshots.

---

## Phase B — Capture screenshots (45–60 min)

Create a folder on your PC:

```
C:\Users\eyabo\Desktop\TunisianHope\submission_screenshots\
```

Name files clearly, e.g. `01-login-counselor.png`, `02-dashboard.png`, …

### Required screenshots (minimum set)

| File name (suggested) | How to capture |
|----------------------|----------------|
| `01-login.png` | Login page with username filled |
| `02-dashboard-counselor.png` | Logged in as `counselor_sara`, Dashboard visible |
| `03-case-note.png` | Case C-1042, note added or Notes tab |
| `04-appointments-missed.png` | Appointments with a missed session |
| `05-alerts.png` | Alerts page with at least one alert |
| `06-operator-referral-blocked.png` | `operator_nour`, Appointments → Trigger Referral → error |
| `07-audit-log-blocked.png` | Audit Log filtered showing Blocked / referral / awareness |
| `08-youth-observation.png` | Y-3001 with observation text |
| `09-awareness-action.png` | Awareness action sent or Awareness Actions queue |
| `10-assessment-conflict.png` | Y-3007, send action → error message |
| `11-reports-csv-pdf.png` | Reports page + downloaded files in Explorer |
| `12-settings-policies.png` | Admin Settings with policies |
| `13-pytest-passed.png` | Terminal: 14 passed |
| `14-docs-folder.png` | File Explorer: `Backend\docs\` files visible |
| `15-datasets.png` | File Explorer: `Backend\datasets\*.csv` |

**Tips:**

- Hide personal bookmarks; use a clean browser window.
- Include the **sidebar** so the examiner sees navigation.
- For bilingual bonus: one screenshot in **Arabic** (language switcher in top bar).

---

## Phase C — Write the report PDF (60–90 min)

**Ready-made draft:** open **`docs/EXAM_REPORT.md`** — full report text aligned with the exam PDF rubric. Copy into Word/Google Docs, add your name, insert screenshots in Section 18, export to PDF.

Suggested filename: `Bayoudhi_[YourName]_TunisianHope_Report.pdf`

### Suggested structure (8–15 pages) — also covered in EXAM_REPORT.md

1. **Cover page**  
   - Project title, your name, group, date, course, instructor name.

2. **Problem statement (½ page)**  
   - Copy/summarize from `Backend/docs/problem_statement.md`.  
   - NGO: Tunisian Hope and Future for Children and Youth.

3. **Scenarios implemented (1 page)**  
   - **Scenario 2:** mental-health follow-up (cases, sessions, alerts, referrals).  
   - **Scenario 3:** youth digital behavior (profiles, observations, awareness).  
   - **Scenario 1:** explicitly **not implemented** — justify (focus + time); point to `ethics_and_limitations.md`.

4. **Architecture (1 page)**  
   - Diagram or bullet list: React (Vite) → REST API → Django → SQLite.  
   - Mention apps: `api`, `cases`, `workflows`, `accounts`.

5. **Roles & security (1 page)**  
   - Table from `Backend/docs/roles_matrix.md`.  
   - Session auth + CSRF; audit log.

6. **Failure handling (1 page)**  
   - S2: operator referral 403, malformed intake 400.  
   - S3: operator send blocked 403, assessment conflict 409.  
   - Paste screenshots `06`, `07`, `10` + pytest excerpt.

7. **Datasets (½ page)**  
   - List 4 CSV files and `py manage.py load_demo_data`.  
   - Reference `data_dictionary.md`.

8. **Advanced tracks (½ page)**  
   - Track B (security/privacy) + Track C (API quality) from `advanced_tracks.md`.

9. **Testing (1 page)**  
   - Manual: reference `docs/TESTING_GUIDE.md`.  
   - Automated: paste screenshot `13-pytest-passed.png` + list test names.

10. **User guide (1 page)**  
    - Demo accounts table.  
    - Quick start commands from `README.md`.

11. **Limitations & ethics (½ page)**  
    - Synthetic data only, not for real clinical use — from `ethics_and_limitations.md`.

12. **Appendix — screenshots**  
    - Insert all PNGs from Phase B with captions.

### Export

- **File → Export → PDF** (or Print to PDF).  
- Check file size (Moodle often limits 20–50 MB; compress images if needed).

---

## Phase D — Create presentation slides (45–60 min)

Target: **8–12 slides**, **5–10 minutes** oral presentation.

Suggested slide outline:

| Slide | Title | Content |
|-------|--------|---------|
| 1 | Title | Project name, your name, SESAME, 2026 |
| 2 | Problem | NGO mission, youth mental health + digital risk |
| 3 | Scenarios | S2 + S3 only; why not S1 |
| 4 | Architecture | Frontend / API / DB diagram |
| 5 | Demo flow S2 | Cases → sessions → alerts (one screenshot) |
| 6 | Demo flow S3 | Profiles → observations → actions (one screenshot) |
| 7 | RBAC | roles_matrix table (small) |
| 8 | Failures | Referral block + assessment conflict screenshots |
| 9 | Audit & reports | Audit Log + CSV/PDF export |
| 10 | Datasets & docs | CSV list + `Backend/docs/` |
| 11 | Tests | pytest 14 passed screenshot |
| 12 | Conclusion | Tracks B+C, limitations, thank you |

**Export:** `Bayoudhi_[YourName]_TunisianHope_Slides.pptx` (and optional PDF).

---

## Phase E — Package source code zip (20 min)

### Step E1 — Clean unnecessary files

Do **not** include:

- `Frontend/node_modules/`
- `Frontend/dist/`
- `Backend/**/__pycache__/`
- `Backend/.pytest_cache/`
- `.git/` (unless Moodle asks for Git link separately)
- `Backend/db.sqlite3` (optional — examiner can recreate; **or** include it with demo data pre-loaded)

### Step E2 — Create zip (PowerShell)

From project parent folder:

```powershell
cd C:\Users\eyabo\Desktop
Compress-Archive -Path TunisianHope -DestinationPath TunisianHope_submission.zip -Force
```

**Better (smaller zip):** exclude heavy folders manually:

1. Copy `TunisianHope` → `TunisianHope_submit`
2. Delete `TunisianHope_submit\Frontend\node_modules`
3. Delete `TunisianHope_submit\Frontend\dist`
4. Delete all `__pycache__` and `.pytest_cache`
5. Zip `TunisianHope_submit` → `TunisianHope_submission.zip`

Suggested zip name:

`Bayoudhi_[YourName]_TunisianHope_Source.zip`

### Step E3 — Include a README pointer

Ensure zip contains root `README.md` with:

- Install steps
- Demo accounts
- Link to `docs/TESTING_GUIDE.md` and `docs/MOODLE_DELIVERABLES.md`

---

## Phase F — Upload to Moodle (15 min)

### Step F1 — Open the assignment

1. Log in to Moodle (SESAME).
2. Open course **Python Web Programming** (or exact course name).
3. Find assignment: **Project submission** / **Final project** (read instructions on that page).

### Step F2 — Upload files

Usually one or more of:

| Upload slot | Your file |
|-------------|-----------|
| Source code | `TunisianHope_submission.zip` |
| Report | `..._Report.pdf` |
| Slides | `..._Slides.pptx` or `.pdf` |
| Screenshots | Optional zip of `submission_screenshots/` if separate field |

If only **one** file allowed: put PDF report + screenshots inside the zip and mention slides as separate upload if permitted.

### Step F3 — Fill text fields

In the submission comment box, paste:

```
Tunisian Hope — Youth Support Platform
Scenarios: 2 (mental-health follow-up) + 3 (youth digital behavior)
Scenario 1 (education): not implemented — documented in Backend/docs/ethics_and_limitations.md

Quick start:
  Backend: py -m pip install -r requirements.txt && py manage.py migrate && py manage.py load_demo_data && py manage.py runserver
  Frontend: npm install && npm run dev
  UI: http://localhost:5173

Demo accounts:
  counselor_sara / Counselor@123
  operator_nour / Operator@123
  admin_karim / Admin@123

Tests: cd Backend && py -m pytest api/tests.py -v  (14 tests)

Full testing guide: docs/TESTING_GUIDE.md
```

### Step F4 — Submit before deadline

- Click **Submit assignment**.
- Confirm email receipt if Moodle sends one.
- Keep a local copy of the zip and PDF.

---

## Phase G — Oral defense preparation (30 min)

1. Rehearse the **5-minute demo** in [TESTING_GUIDE.md](./TESTING_GUIDE.md) Section 8.
2. Be ready to answer:
   - Why two scenarios and not three?
   - Where is RBAC enforced? (`api/views.py`, session auth)
   - Show one failure live (operator referral or Y-3007 conflict)
   - Where is audit stored? (`cases.AuditLog`, `api.PlatformAuditLog`)
   - What are Tracks B and C?
3. Open in IDE before defense:
   - `Backend/api/views.py`
   - `Backend/api/tests.py`
   - `Backend/docs/roles_matrix.md`

---

## Final checklist before you click Submit

- [ ] `py -m pytest api/tests.py -v` → 14 passed (screenshot saved)
- [ ] App runs: backend + frontend, login works
- [ ] Report PDF includes architecture, scenarios, failures, screenshots
- [ ] Slides ready (8–12 slides)
- [ ] Zip excludes `node_modules` and `dist`
- [ ] Zip includes `README.md`, `Backend/docs/`, `Backend/datasets/`
- [ ] Demo accounts documented in submission comment
- [ ] Scenario 1 omission explained in report
- [ ] All screenshots captioned in report appendix

---

## File map — what goes where

```
TunisianHope/
├── README.md                          ← examiner reads first
├── docs/
│   ├── TESTING_GUIDE.md               ← full QA + exam expectations
│   ├── MOODLE_DELIVERABLES.md         ← this file
│   └── SUBMISSION.md                  ← short checklist
├── Backend/
│   ├── docs/                          ← governance (required by exam)
│   ├── datasets/*.csv                 ← Step 3 synthetic data
│   ├── api/tests.py                   ← pytest
│   └── requirements.txt
└── Frontend/
    └── src/                           ← React UI
```

---

*Good luck with your submission. If Moodle asks for a specific template, match their section titles but keep the same evidence (screenshots + pytest + S2/S3 demo).*
