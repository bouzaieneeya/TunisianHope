# Roles and Permissions Matrix

| Action | Operator | Counselor (supervisor) | Admin |
|--------|:--------:|:----------------------:|:-----:|
| Login / view dashboard | ✓ | ✓ | ✓ |
| Create mental-health case | ✓ | ✓ | ✓ |
| Add clinical note | ✓ | ✓ | ✓ |
| Schedule / update session | ✓ | ✓ | ✓ |
| Mark session attended/missed | — | ✓ | ✓ |
| Trigger referral | — | ✓ | ✓ |
| Acknowledge / escalate alert | — | ✓ | ✓ |
| Dismiss alert | — | — | ✓ |
| Update risk thresholds | — | ✓ | ✓ |
| Create youth profile | ✓ | ✓ | ✓ |
| Add youth observation | ✓ | ✓ | ✓ |
| Send awareness action | — | ✓ | ✓ |
| Update awareness action status | — | ✓ | ✓ |
| Assign counselor (youth) | — | — | ✓ |
| Manage users | — | — | ✓ |
| System policies | — | — | ✓ |
| Export reports (CSV) | ✓ | ✓ | ✓ |

**Enforcement:** Django session auth + `IsAuthenticated` on API views; role checks in `Backend/api/views.py` (`_role_from_request`, `_forbidden`, `_is_admin`).

**Frontend:** route guard for `/users-management` (admin only); action buttons hidden by role where appropriate.
