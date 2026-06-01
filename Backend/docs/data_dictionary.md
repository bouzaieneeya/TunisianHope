# Data Dictionary (Synthetic Datasets)

Primary loader: `Backend/datasets/load_datasets.py`

## Scenario 2 — Mental health cases

**File:** `mental_health_cases.csv`

| Column | Type | Description |
|--------|------|-------------|
| case_code | string | Unique case ID (e.g. C-2001) |
| age | int | Age at intake |
| gender | M/F | Gender code |
| region | string | Tunisian region |
| school_or_center | string | Facility name |
| initial_score | float | Initial risk score 0–100 |
| risk_level | string | low, medium, high, critical |
| status | string | Workflow status |
| notes | text | Intake notes |

**File:** `followup_sessions.csv`

| Column | Type | Description |
|--------|------|-------------|
| case_code | string | FK to case |
| scheduled_date | date | Session date |
| status | string | present, absent, cancelled, scheduled |
| notes | text | Session notes |

## Scenario 3 — Digital youth profiles

**File:** `youth_digital_profiles.csv`

| Column | Type | Description |
|--------|------|-------------|
| code | string | Profile ID (Y-3001) |
| age_group | string | e.g. 15-17 |
| school | string | School or center |
| counselor | string | Assigned counselor name |
| risk_level | string | low, moderate, high, critical |
| status | string | active, pending_review, closed |
| last_assessment_date | date | Last digital assessment |

**File:** `awareness_actions.csv`

| Column | Type | Description |
|--------|------|-------------|
| profile_code | string | FK to youth profile |
| action_type | string | informational, preventive, referral |
| channel | string | in_person, online, sms |
| counselor | string | Responsible counselor |
| rationale | text | Human-readable reason |
| status | string | pending, sent, acknowledged, etc. |

## Additional research CSVs
Under `datasets/data/` and `datasets/data_cleaned/` — supplementary synthetic sources for analysis previews; not all are loaded by default. Use `previewdata.py` for exploration.

## Provenance
- Generated/edited for **SESAME Django exam project**.
- **Not** derived from real student or patient records.
