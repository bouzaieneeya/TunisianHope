# Tunisian Hope - Youth Support Platform



Django + React platform for **SESAME University exam project** (Chaouki Bayoudhi, 2025–2026).



**Operational scenarios implemented:**

- **Scenario 2** — Mental health / follow-up (cases, sessions, alerts, referrals)

- **Scenario 3** — Youth digital behavior support (profiles, observations, awareness actions)



Synthetic data only. Not for production clinical use.



---



## Project structure



| Path | Purpose |

|------|---------|

| `Backend/` | Django 5 + DRF, SQLite, pytest |

| `Frontend/` | React + Vite + TypeScript UI |

| `Backend/docs/` | Problem statement, roles, risk register, ethics, tracks |

| `docs/SUBMISSION.md` | Moodle package & demo script |



---



## Quick start



### Backend (`Backend/`)



```powershell

py -m pip install -r requirements.txt

py manage.py migrate

py manage.py load_demo_data

py manage.py runserver

```



API: `http://127.0.0.1:8000/api/`



### Frontend (`Frontend/`)



```powershell

npm install

npm run dev

```



UI: `http://localhost:5173` (proxies `/api` → Django)



---



## Demo accounts



| Username | Password | Role |

|----------|----------|------|

| `operator_nour` | `Operator@123` | Operator |

| `counselor_sara` | `Counselor@123` | Counselor |

| `admin_karim` | `Admin@123` | Admin |



Created automatically on first login if missing.



---



## Load synthetic datasets



From `Backend/`:



```powershell

py manage.py shell -c "exec(open('datasets/load_datasets.py', encoding='utf-8').read())"

```



Files: `mental_health_cases.csv`, `followup_sessions.csv`, `youth_digital_profiles.csv`, `awareness_actions.csv`  

See `Backend/docs/data_dictionary.md`.



---



## Run tests



From `Backend/`:



```powershell

py -m pytest api/tests.py -v

```



Covers dashboard, permissions (403 + audit log), alerts, timeline, notes, observations.



---



## Scenario 2 demo path



1. Login as **counselor_sara**

2. **Cases** → open a case → **Add clinical note**

3. **Appointments** → schedule session → **Mark missed** → check **Alerts**

4. **Alerts** → acknowledge

5. **Audit Log** → verify entries



**Failure evidence:** Login as **operator_nour** → case detail → **Trigger referral** (blocked) → **Audit Log**  

Or: **Admin** → **Settings** → **Cycle failure scenario** → review Cases / Audit Log  

Or: `py -m pytest api/tests.py::ScenarioApiTests::test_s2_referral_blocked_for_operator -v`



---



## Scenario 3 demo path



1. **Youth Profiles** → **Y-3001** → **Add observation**

2. **Send awareness action** (counselor only)

3. **Risk Monitor** / **Awareness Actions** queue



**Failure evidence:** Settings → failure mode **S3 assessment conflict** → open **Y-3007**



---



## API overview



Base: `/api/`



- Auth: `POST /login/`, `GET /logout/`, `GET /auth/me/`

- Scenario 2: `/scenario2/dashboard/`, `/cases/`, `/alerts/`, `/sessions/`, notes, referral, reminder

- Scenario 3: `/scenario3/profiles/`, observations, `/actions/send/`

- Admin: `/users/`, `/settings/policies/`, `/reports/export/?format=csv`



Full list in code: `Backend/api/urls.py`



---



## Governance documentation



- `Backend/docs/problem_statement.md`

- `Backend/docs/roles_matrix.md`

- `Backend/docs/state_machine.md`

- `Backend/docs/risk_register.md`

- `Backend/docs/ethics_and_limitations.md`

- `Backend/docs/advanced_tracks.md` (Tracks B + C)



---



## Languages



English, French, Arabic (RTL) — switch in top bar or Settings.



---



## Moodle submission



See `docs/EXAM_REPORT.md` (report draft for PDF), `docs/TESTING_GUIDE.md` (full QA), `docs/MOODLE_DELIVERABLES.md` (slides, zip, Moodle upload), and `docs/SUBMISSION.md` (short checklist).


