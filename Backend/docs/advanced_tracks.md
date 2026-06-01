# Advanced Tracks Evidence (≥2 required)

This project documents **Track C** and **Track B** with code references.

## Track C — API and integration quality

| Evidence | Location |
|----------|----------|
| REST API with DRF | `Backend/api/views.py`, `Backend/api/urls.py` |
| Serializers + validation | `Backend/api/serializers.py` |
| Structured error responses (403/400) | `scenario2_*`, `scenario3_*` views |
| React SPA integration | `Frontend/src/lib/api.ts`, Vite proxy |
| Session + CSRF for mutations | `config/settings.py`, `api.ts` X-CSRFToken |
| Contract tests | `Backend/api/tests.py` |

## Track B — Security and privacy by design

| Evidence | Location |
|----------|----------|
| Custom user roles | `accounts.models` (`operator`, `supervisor`, `admin`) |
| Permission checks per endpoint | `api/views.py` (`_forbidden`, role gates) |
| Audit trail | `cases.models.AuditLog` |
| CSRF trusted origins | `config/settings.py` |
| Demo data only / no PII | `docs/ethics_and_limitations.md` |
| Permission tests | `test_s2_referral_blocked_for_operator`, etc. |

## Track D — Observability (partial)

| Evidence | Location |
|----------|----------|
| Python logging config | `config/settings.py` LOGGING |
| Case/workflow loggers | `cases.models`, `workflows.models` |
| Audit log UI | `Frontend/src/pages/AuditLog.tsx` |

## Not implemented (optional)
- GraphQL / gRPC
- Web scraping pipeline
- LLM / RAG (Track E/F) — intentionally omitted to keep mandatory flows stable
