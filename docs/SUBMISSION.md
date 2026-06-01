# Moodle Submission Package — Tunisian Hope

**Student project:** Tunisian Hope and Future for Children and Youth  
**Scenarios delivered:** Scenario 2 (mental-health follow-up) + Scenario 3 (digital behavior support)

> **Full guides:** [EXAM_REPORT.md](./EXAM_REPORT.md) (report draft for PDF) · [TESTING_GUIDE.md](./TESTING_GUIDE.md) (test every feature) · [MOODLE_DELIVERABLES.md](./MOODLE_DELIVERABLES.md) (zip, slides, upload)

## Package contents

| Item | Path |
|------|------|
| Source code | Repository root (`Backend/`, `Frontend/`) |
| README | `README.md` |
| Problem & governance | `Backend/docs/` |
| Synthetic datasets | `Backend/datasets/*.csv` |
| Exam brief (reference) | `exam_Project_python_web_programming_Djnago_Chaouki_Bayoudhi_2026 (6).pdf` |

## Evidence checklist (attach screenshots)

1. **Login** — three roles (operator, counselor, admin)
2. **Scenario 2** — case list → case detail → add note → schedule session → alert on missed session
3. **Scenario 2 failure** — operator referral blocked (403) + Audit Log entry OR pytest output
4. **Scenario 3** — youth profile → observation → awareness action
5. **Scenario 3 failure** — Settings → Demo failure mode → assessment conflict on Y-3007
6. **Dashboard** — KPIs and active alerts
7. **Reports** — CSV export download
8. **Tests** — terminal output of `py -m pytest api/tests.py -v`

## 5-minute demo script

1. Login as `counselor_sara` → Dashboard → Cases → open C-1042 → add note.
2. Appointments → schedule session → mark missed → show alert.
3. Alerts → acknowledge one alert.
4. Youth Profiles → Y-3001 → add observation → send awareness action.
5. Audit Log → filter by case.
6. Logout → login as `operator_nour` → try referral (blocked) → show Audit Log.
7. Admin: Settings → policies + failure demo (optional).

## Before uploading to Moodle

```powershell
cd Backend
py -m pytest api/tests.py -v
py manage.py migrate
```

Zip the project **excluding** `node_modules/`, `Frontend/dist/`, `__pycache__/`, `.pytest_cache/`.
