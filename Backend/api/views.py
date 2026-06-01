import csv
import io
from datetime import timedelta

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.models import (
    AwarenessAction,
    DigitalAssessment,
    PlatformAuditLog,
    SystemPolicy,
    YouthObservation,
    YouthProfile,
)
from api.serializers import (
    AlertSerializer,
    AuditLogSerializer,
    AwarenessActionSerializer,
    DigitalAssessmentSerializer,
    PlatformAuditLogSerializer,
    RiskThresholdSerializer,
    SessionSerializer,
    SystemPolicySerializer,
    YouthObservationSerializer,
    YouthProfileSerializer,
)
from cases.models import AuditLog, Case
from workflows.models import Alert, RiskThresholdConfig, Session


def _ensure_demo_users():
    """Create missing demo users only — never re-hash passwords on every login."""
    User = get_user_model()
    seeds = [
        ("operator_nour", "Operator@123", "operator", "Nour", "B."),
        ("counselor_sara", "Counselor@123", "supervisor", "Sara", "M."),
        ("admin_karim", "Admin@123", "admin", "Karim", "H."),
    ]
    usernames = [row[0] for row in seeds]
    if User.objects.filter(username__in=usernames).count() == len(seeds):
        return

    for username, password, role, first_name, last_name in seeds:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "role": role,
                "first_name": first_name,
                "last_name": last_name,
            },
        )
        if created:
            user.set_password(password)
            user.is_active = True
            user.save()
            continue

        changed = False
        if user.role != role:
            user.role = role
            changed = True
        if user.first_name != first_name:
            user.first_name = first_name
            changed = True
        if user.last_name != last_name:
            user.last_name = last_name
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if changed:
            user.save()


def _frontend_role(user_role: str) -> str:
    return "Counselor" if user_role == "supervisor" else user_role.capitalize()


def _is_admin(user) -> bool:
    return bool(user and user.is_authenticated and getattr(user, "role", "") == "admin")


def _serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "name": user.get_full_name() or user.username,
        "role": _frontend_role(user.role),
        "email": user.email,
        "phone": getattr(user, "phone", ""),
        "center": getattr(user, "center", ""),
        "is_active": user.is_active,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def auth_login(request):
    _ensure_demo_users()
    username = request.data.get("username")
    password = request.data.get("password")
    if not username or not password:
        return Response(
            {"detail": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

    login(request, user)
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "name": user.get_full_name() or user.username,
            "role": _frontend_role(user.role),
            "initials": (
                f"{(user.first_name or user.username)[:1]}{(user.last_name or user.username)[:1]}"
            ).upper(),
            "csrf_token": get_token(request),
        }
    )


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def auth_logout(request):
    if request.user and request.user.is_authenticated:
        logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def auth_me(request):
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "name": user.get_full_name() or user.username,
            "role": _frontend_role(user.role),
            "initials": (
                f"{(user.first_name or user.username)[:1]}{(user.last_name or user.username)[:1]}"
            ).upper(),
            "csrf_token": get_token(request),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    return auth_login(request)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def logout_view(request):
    return auth_logout(request)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_user(request):
    if not _is_admin(request.user):
        return Response(
            {"detail": "Only admin can create users."},
            status=status.HTTP_403_FORBIDDEN,
        )

    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    role = (request.data.get("role") or "operator").strip().lower()
    first_name = (request.data.get("first_name") or "").strip()
    last_name = (request.data.get("last_name") or "").strip()
    email = (request.data.get("email") or "").strip()
    phone = (request.data.get("phone") or "").strip()
    center = (request.data.get("center") or "").strip()

    if not username or not password:
        return Response(
            {"detail": "username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if role not in {"operator", "supervisor", "admin"}:
        return Response(
            {"detail": "role must be one of: operator, supervisor, admin."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        password=password,
        role=role,
        first_name=first_name,
        last_name=last_name,
        email=email,
    )
    if hasattr(user, "phone"):
        user.phone = phone
    if hasattr(user, "center"):
        user.center = center
    user.save()

    return Response(_serialize_user(user), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_list(request):
    if not _is_admin(request.user):
        return Response(
            {"detail": "Only admin can list users."},
            status=status.HTTP_403_FORBIDDEN,
        )

    User = get_user_model()
    users = User.objects.order_by("id")
    return Response([_serialize_user(user) for user in users])


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    if not _is_admin(request.user):
        return Response(
            {"detail": "Only admin can update users."},
            status=status.HTTP_403_FORBIDDEN,
        )

    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)

    role = request.data.get("role")
    if role is not None:
        normalized_role = str(role).strip().lower()
        if normalized_role not in {"operator", "supervisor", "admin"}:
            return Response(
                {"detail": "role must be one of: operator, supervisor, admin."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.role = normalized_role

    for field in ["first_name", "last_name", "email"]:
        if field in request.data:
            setattr(user, field, (request.data.get(field) or "").strip())
    if "phone" in request.data and hasattr(user, "phone"):
        user.phone = (request.data.get("phone") or "").strip()
    if "center" in request.data and hasattr(user, "center"):
        user.center = (request.data.get("center") or "").strip()

    password = request.data.get("password")
    if password:
        user.set_password(password)

    user.save()
    return Response(_serialize_user(user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_user_active(request, user_id):
    if not _is_admin(request.user):
        return Response(
            {"detail": "Only admin can change user status."},
            status=status.HTTP_403_FORBIDDEN,
        )

    User = get_user_model()
    user = get_object_or_404(User, pk=user_id)
    if user.id == request.user.id:
        return Response(
            {"detail": "You cannot deactivate your own account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    is_active = request.data.get("is_active")
    user.is_active = bool(is_active)
    user.save(update_fields=["is_active"])
    return Response(_serialize_user(user))


def _seed_demo_data():
    if not Case.objects.exists():
        base_cases = [
            ("C-1042", 17, "high", "active", 68.0),
            ("C-1044", 16, "critical", "followup", 82.0),
            ("C-1048", 17, "medium", "active", 41.0),
        ]
        for code, age, risk, status_value, score in base_cases:
            Case.objects.create(
                code=code,
                age=age,
                gender="F",
                region="Tunis",
                school_or_center="Centre El Manar",
                risk_level=risk,
                status=status_value,
                initial_score=score,
            )

    if not Session.objects.exists():
        for case in Case.objects.all():
            Session.objects.create(
                case=case, scheduled_date="2026-04-12", status="present", recorded_by=None
            )
            Session.objects.create(
                case=case, scheduled_date="2026-04-19", status="absent", recorded_by=None
            )

    if not YouthProfile.objects.exists():
        p1 = YouthProfile.objects.create(
            code="Y-3001",
            age_group="15-17",
            school="Lycee Carthage",
            counselor="Sara M.",
            risk_level="high",
            status="active",
            last_assessment_date="2026-04-22",
        )
        p2 = YouthProfile.objects.create(
            code="Y-3007",
            age_group="18-20",
            school="Centre El Manar",
            counselor="Amine T.",
            risk_level="critical",
            status="pending_review",
            last_assessment_date="2026-04-20",
        )
        DigitalAssessment.objects.create(
            profile=p1, submitted_by="Sara M.", risk_score=7.4, risk_level="high"
        )
        DigitalAssessment.objects.create(
            profile=p2, submitted_by="Amine T.", risk_score=8.9, risk_level="critical"
        )
        DigitalAssessment.objects.create(
            profile=p2, submitted_by="Amine T.", risk_score=8.7, risk_level="critical"
        )
        AwarenessAction.objects.create(
            profile=p1,
            action_type="preventive",
            channel="in_person",
            counselor="Sara M.",
            rationale="Screen time excess sustained over 3 assessments",
            status="pending",
        )
        AwarenessAction.objects.create(
            profile=p2,
            action_type="referral",
            channel="in_person",
            counselor="Amine T.",
            rationale="Cyberbullying risk reached 9/10",
            status="sent",
        )


def _role_from_request(request):
    if request.user and request.user.is_authenticated:
        return request.user.role
    return (request.headers.get("X-User-Role") or "operator").lower()


def _forbidden(role, action, case):
    reason = f"Role '{role}' cannot perform action '{action}'."
    AuditLog.objects.create(
        case=case,
        actor=None,
        action=f"Blocked action: {action}",
        result="failure",
        reason=reason,
    )
    return Response({"detail": reason}, status=status.HTTP_403_FORBIDDEN)


def _log_case_action(case, actor, action, reason=""):
    AuditLog.objects.create(
        case=case,
        actor=actor if actor and actor.is_authenticated else None,
        action=action,
        result="success",
        reason=reason,
    )


def _actor_meta(request):
    user = request.user if request.user and request.user.is_authenticated else None
    if not user:
        return None, "system", "system"
    role = getattr(user, "role", "operator")
    name = user.get_full_name() or user.username
    return user, name, role


def _log_platform(request, action, affected_id, domain, result, reason=""):
    user, name, role = _actor_meta(request)
    PlatformAuditLog.objects.create(
        actor=user,
        actor_name=name,
        actor_role=role,
        action=action,
        affected_id=affected_id,
        domain=domain,
        result=result,
        reason=reason,
    )


def _validate_case_intake(data):
    errors = []
    age = data.get("age")
    if age is None or age == "":
        errors.append("age is required")
    else:
        try:
            age_int = int(age)
            if age_int < 10 or age_int > 25:
                errors.append("age must be between 10 and 25")
        except (TypeError, ValueError):
            errors.append("age must be a valid integer")
    if not (data.get("region") or "").strip():
        errors.append("region is required")
    if not (data.get("school_or_center") or "").strip():
        errors.append("school_or_center is required")
    return errors


def _dashboard_adherence_weeks():
    buckets = {}
    for session in Session.objects.all().order_by("scheduled_date"):
        key = session.scheduled_date.strftime("%Y-W%W")
        if key not in buckets:
            buckets[key] = {"week": key, "Scheduled": 0, "Attended": 0}
        buckets[key]["Scheduled"] += 1
        if session.status == "present":
            buckets[key]["Attended"] += 1
    rows = list(buckets.values())[-8:]
    if not rows:
        return [{"week": "W1", "Scheduled": 0, "Attended": 0}]
    return rows


def _next_case_code():
    existing = (
        Case.objects.filter(code__startswith="C-")
        .order_by("-code")
        .values_list("code", flat=True)
        .first()
    )
    if not existing:
        return "C-2001"
    try:
        suffix = int(existing.split("-", 1)[1])
    except (IndexError, ValueError):
        suffix = 2000
    return f"C-{suffix + 1}"


def _next_profile_code():
    existing = (
        YouthProfile.objects.filter(code__startswith="Y-")
        .order_by("-code")
        .values_list("code", flat=True)
        .first()
    )
    if not existing:
        return "Y-3010"
    try:
        suffix = int(existing.split("-", 1)[1])
    except (IndexError, ValueError):
        suffix = 3000
    return f"Y-{suffix + 1}"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario2_dashboard(request):
    _seed_demo_data()
    cases_qs = Case.objects.all()
    alerts_qs = Alert.objects.filter(is_resolved=False)
    sessions_qs = Session.objects.all()

    upcoming = []
    for session in sessions_qs.select_related("case").order_by("-scheduled_date")[:8]:
        case = session.case
        upcoming.append(
            {
                "id": session.id,
                "case_code": case.code,
                "scheduled_date": session.scheduled_date.isoformat(),
                "status": session.status,
                "counselor": case.assigned_to.username if case.assigned_to else "Unassigned",
            }
        )

    payload = {
        "active_cases": cases_qs.exclude(status="closed").count(),
        "appointments_this_week": sessions_qs.count(),
        "missed_sessions": sessions_qs.filter(status="absent").count(),
        "referrals_pending": cases_qs.filter(status="alert").count(),
        "risk_distribution": list(cases_qs.values("risk_level").annotate(count=Count("id"))),
        "recent_alerts": AlertSerializer(alerts_qs[:8], many=True).data,
        "adherence_weeks": _dashboard_adherence_weeks(),
        "upcoming_sessions": upcoming,
    }
    return Response(payload)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def scenario2_thresholds(request):
    _seed_demo_data()
    config = RiskThresholdConfig.get_current()
    role = _role_from_request(request)
    if request.method == "GET":
        return Response(RiskThresholdSerializer(config).data)

    if role not in {"supervisor", "admin"}:
        case = Case.objects.first()
        if case:
            return _forbidden(role, "update_thresholds", case)
        return Response(
            {"detail": "No case exists yet to log blocked action."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = RiskThresholdSerializer(config, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scenario2_create_session(request, case_id):
    _seed_demo_data()
    case = get_object_or_404(Case, pk=case_id)
    serializer = SessionSerializer(data={**request.data, "case": case.id})
    serializer.is_valid(raise_exception=True)
    actor = request.user if request.user.is_authenticated else None
    session = serializer.save(recorded_by=actor)
    _log_case_action(
        case,
        actor,
        "Appointment scheduled",
        f"{session.scheduled_date} ({session.get_status_display()})",
    )
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario2_sessions_list(request):
    _seed_demo_data()
    rows = []
    for session in Session.objects.select_related("case", "case__assigned_to").all():
        case = session.case
        rows.append(
            {
                "id": session.id,
                "case_id": case.id,
                "case_code": case.code,
                "scheduled_date": session.scheduled_date.isoformat(),
                "status": session.status,
                "notes": session.notes,
                "counselor": case.assigned_to.username if case.assigned_to else "Unassigned",
            }
        )
    return Response(rows)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def scenario2_update_session(request, session_id):
    _seed_demo_data()
    session = get_object_or_404(Session, pk=session_id)
    new_status = (request.data.get("status") or "").strip().lower()
    if new_status not in {"scheduled", "present", "absent", "cancelled"}:
        return Response(
            {"detail": "status must be scheduled, present, absent, or cancelled."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session.status = new_status
    if request.data.get("notes") is not None:
        session.notes = request.data.get("notes") or ""
    actor = request.user if request.user.is_authenticated else None
    session.recorded_by = actor
    session.save()

    label = {
        "present": "Session marked attended",
        "absent": "Session marked missed",
        "cancelled": "Session cancelled",
        "scheduled": "Session rescheduled",
    }.get(new_status, "Session updated")
    _log_case_action(session.case, actor, label, session.notes)
    return Response(SessionSerializer(session).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scenario2_send_reminder(request, case_id):
    _seed_demo_data()
    case = get_object_or_404(Case, pk=case_id)
    message = (request.data.get("message") or "Automated appointment reminder sent.").strip()
    actor = request.user if request.user.is_authenticated else None
    _log_case_action(case, actor, "Reminder sent", message)
    return Response({"detail": "Reminder logged", "case_id": case.id})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario2_case_timeline(request, case_id):
    _seed_demo_data()
    case = get_object_or_404(Case, pk=case_id)
    logs = AuditLog.objects.filter(case=case)
    return Response(AuditLogSerializer(logs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scenario2_add_note(request, case_id):
    _seed_demo_data()
    case = get_object_or_404(Case, pk=case_id)
    text = (request.data.get("note") or request.data.get("text") or "").strip()
    if not text:
        return Response(
            {"detail": "note is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    actor = request.user if request.user.is_authenticated else None
    log = AuditLog.objects.create(
        case=case,
        actor=actor,
        action="Clinical note added",
        result="success",
        reason=text,
    )
    return Response(AuditLogSerializer(log).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scenario2_trigger_referral(request, case_id):
    _seed_demo_data()
    role = _role_from_request(request)
    case = get_object_or_404(Case, pk=case_id)
    if role not in {"supervisor", "admin", "counselor"}:
        return _forbidden(role, "trigger_referral", case)

    reason = (request.data.get("reason") or "").strip()
    case.status = "alert"
    case.save(update_fields=["status", "updated_at"])
    AuditLog.objects.create(
        case=case,
        actor=request.user if request.user.is_authenticated else None,
        action="Referral triggered",
        result="success",
        reason=reason or "Manual referral action by privileged role",
    )
    return Response({"detail": "Referral triggered", "case_status": case.status})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario2_alerts(request):
    _seed_demo_data()
    data = AlertSerializer(Alert.objects.order_by("-created_at")[:30], many=True).data
    return Response(data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def scenario2_update_alert(request, alert_id):
    _seed_demo_data()
    alert = get_object_or_404(Alert, pk=alert_id)
    action = (request.data.get("action") or "").strip().lower()
    role = _role_from_request(request)
    actor = request.user if request.user.is_authenticated else None

    if action == "acknowledge":
        if role not in {"supervisor", "admin", "counselor"}:
            return _forbidden(role, "acknowledge_alert", alert.case)
        alert.resolve(actor)
        _log_case_action(alert.case, actor, "Alert acknowledged", alert.explanation)
    elif action == "dismiss":
        if role != "admin":
            return _forbidden(role, "dismiss_alert", alert.case)
        alert.resolve(actor)
        _log_case_action(alert.case, actor, "Alert dismissed", alert.explanation)
    elif action == "escalate":
        if role not in {"supervisor", "admin", "counselor"}:
            return _forbidden(role, "escalate_alert", alert.case)
        alert.case.status = "alert"
        alert.case.save(update_fields=["status", "updated_at"])
        _log_case_action(
            alert.case,
            actor,
            "Alert escalated",
            request.data.get("reason") or alert.explanation,
        )
    else:
        return Response(
            {"detail": "action must be acknowledge, dismiss, or escalate."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(AlertSerializer(alert).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def scenario2_cases(request):
    _seed_demo_data()
    if request.method == "POST":
        role = _role_from_request(request)
        if role not in {"operator", "admin"}:
            case = Case.objects.first()
            if case:
                return _forbidden(role, "create_case", case)
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        code = (request.data.get("code") or _next_case_code()).strip()
        intake_errors = _validate_case_intake(request.data)
        if intake_errors:
            _log_platform(
                request,
                "Intake validation",
                code or "NEW",
                "followup",
                "failure",
                "; ".join(intake_errors),
            )
            return Response(
                {"detail": "Malformed intake — validation failed.", "errors": intake_errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        case = Case.objects.create(
            code=code,
            age=int(request.data.get("age")),
            gender=(request.data.get("gender") or "F")[:1],
            region=(request.data.get("region") or "Tunis").strip(),
            school_or_center=(request.data.get("school_or_center") or "Unassigned").strip(),
            initial_score=float(request.data.get("initial_score") or 0),
            risk_level=(request.data.get("risk_level") or "low"),
            status="new",
            created_by=request.user if request.user.is_authenticated else None,
        )
        actor = request.user if request.user.is_authenticated else None
        _log_case_action(case, actor, "Case created", f"Intake for {case.code}")
        return Response(
            {
                "id": case.id,
                "code": case.code,
                "age": case.age,
                "status": case.status,
                "risk_level": case.risk_level,
            },
            status=status.HTTP_201_CREATED,
        )

    payload = []
    for case in Case.objects.all():
        payload.append(
            {
                "id": case.id,
                "code": case.code,
                "age": case.age,
                "status": case.status,
                "risk_level": case.risk_level,
                "intake_date": case.created_at.date().isoformat(),
                "counselor": case.assigned_to.username if case.assigned_to else "Unassigned",
                "last_activity": case.updated_at.isoformat(),
            }
        )
    return Response(payload)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario2_case_detail(request, case_code):
    _seed_demo_data()
    case = get_object_or_404(Case, code=case_code)
    sessions = Session.objects.filter(case=case).order_by("-scheduled_date")
    return Response(
        {
            "case": {
                "id": case.id,
                "code": case.code,
                "age": case.age,
                "status": case.status,
                "risk_level": case.risk_level,
                "intake_date": case.created_at.date().isoformat(),
                "counselor": case.assigned_to.username if case.assigned_to else "Unassigned",
                "last_activity": case.updated_at.isoformat(),
            },
            "sessions": SessionSerializer(sessions, many=True).data,
            "timeline": AuditLogSerializer(AuditLog.objects.filter(case=case), many=True).data,
        }
    )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def scenario3_profiles(request):
    _seed_demo_data()
    if request.method == "POST":
        role = _role_from_request(request)
        if role not in {"operator", "admin"}:
            return Response(
                {"detail": "Only operator/admin can create profiles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        code = (request.data.get("code") or _next_profile_code()).strip()
        profile = YouthProfile.objects.create(
            code=code,
            age_group=(request.data.get("age_group") or "15-17").strip(),
            school=(request.data.get("school") or "Unassigned").strip(),
            counselor=(request.data.get("counselor") or "Unassigned").strip(),
            risk_level=(request.data.get("risk_level") or "low"),
            status=(request.data.get("status") or "active"),
        )
        return Response(
            YouthProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )

    profiles = YouthProfile.objects.all()
    return Response(YouthProfileSerializer(profiles, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def scenario3_update_profile(request, profile_code):
    _seed_demo_data()
    profile = get_object_or_404(YouthProfile, code=profile_code)
    role = _role_from_request(request)
    if role != "admin":
        return Response(
            {"detail": "Only admin can update profiles."},
            status=status.HTTP_403_FORBIDDEN,
        )

    counselor = request.data.get("counselor")
    if counselor:
        profile.counselor = counselor.strip()
    if request.data.get("risk_level"):
        profile.risk_level = request.data["risk_level"]
    if request.data.get("status"):
        profile.status = request.data["status"]
    profile.save()
    return Response(YouthProfileSerializer(profile).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario3_profile_detail(request, profile_code):
    _seed_demo_data()
    profile = get_object_or_404(YouthProfile, code=profile_code)
    return Response(
        {
            "profile": YouthProfileSerializer(profile).data,
            "assessments": DigitalAssessmentSerializer(
                profile.assessments.all()[:10], many=True
            ).data,
            "actions": AwarenessActionSerializer(profile.actions.all()[:10], many=True).data,
            "observations": YouthObservationSerializer(
                profile.observations.all()[:20], many=True
            ).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scenario3_add_observation(request, profile_code):
    _seed_demo_data()
    profile = get_object_or_404(YouthProfile, code=profile_code)
    text = (request.data.get("text") or request.data.get("note") or "").strip()
    if not text:
        return Response(
            {"detail": "text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    actor = request.user if request.user.is_authenticated else None
    actor_name = ""
    if actor:
        actor_name = actor.get_full_name() or actor.username

    observation = YouthObservation.objects.create(
        profile=profile,
        text=text,
        actor=actor,
        actor_name=actor_name,
    )
    return Response(
        YouthObservationSerializer(observation).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario3_actions(request):
    _seed_demo_data()
    return Response(AwarenessActionSerializer(AwarenessAction.objects.all(), many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def scenario3_update_action(request, action_id):
    _seed_demo_data()
    role = _role_from_request(request)
    if role not in {"counselor", "admin", "supervisor"}:
        return Response(
            {"detail": "Only counselor/admin can update awareness actions."},
            status=status.HTTP_403_FORBIDDEN,
        )

    action = get_object_or_404(AwarenessAction, pk=action_id)
    new_status = (request.data.get("status") or "").strip().lower()
    valid = {choice[0] for choice in AwarenessAction.STATUS_CHOICES}
    if new_status and new_status in valid:
        action.status = new_status
    if request.data.get("rationale"):
        action.rationale = request.data["rationale"].strip()
    action.save()
    return Response(AwarenessActionSerializer(action).data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def system_policies(request):
    policy = SystemPolicy.get_current()
    if request.method == "GET":
        return Response(SystemPolicySerializer(policy).data)

    if not _is_admin(request.user):
        return Response(
            {"detail": "Only admin can update policies."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SystemPolicySerializer(policy, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_export(request):
    _seed_demo_data()
    export_format = (request.GET.get("format") or "csv").lower()
    cases = Case.objects.all()
    profiles = YouthProfile.objects.all()
    actions = AwarenessAction.objects.all()

    if export_format == "pdf":
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas

            buffer = io.BytesIO()
            pdf = canvas.Canvas(buffer, pagesize=A4)
            y = 800
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawString(50, y, "Tunisian Hope — Summary Report")
            y -= 30
            pdf.setFont("Helvetica", 10)
            pdf.drawString(50, y, f"Generated: {timezone.now().isoformat()}")
            y -= 20
            pdf.drawString(50, y, f"Cases: {cases.count()} | Youth profiles: {profiles.count()}")
            y -= 30
            pdf.setFont("Helvetica-Bold", 11)
            pdf.drawString(50, y, "At-risk cases (high/critical):")
            y -= 18
            pdf.setFont("Helvetica", 10)
            for case in cases.filter(risk_level__in=["high", "critical"])[:15]:
                if y < 60:
                    pdf.showPage()
                    y = 800
                pdf.drawString(60, y, f"- {case.code} ({case.risk_level}) — {case.school_or_center}")
                y -= 14
            pdf.save()
            buffer.seek(0)
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="tunisian-hope-report.pdf"'
            return response
        except ImportError:
            pass

    if export_format == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["section", "id", "status", "risk", "detail"])
        for case in cases:
            writer.writerow(
                ["case", case.code, case.status, case.risk_level, case.school_or_center]
            )
        for profile in profiles:
            writer.writerow(
                ["youth", profile.code, profile.status, profile.risk_level, profile.school]
            )
        for action in actions:
            writer.writerow(
                ["action", action.id, action.status, action.action_type, action.rationale[:120]]
            )
        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="tunisian-hope-report.csv"'
        return response

    lines = [
        "Tunisian Hope — Summary Report",
        f"Generated: {timezone.now().isoformat()}",
        "",
        f"Cases: {cases.count()}",
        f"Youth profiles: {profiles.count()}",
        f"Awareness actions: {actions.count()}",
        "",
        "At-risk cases:",
    ]
    for case in cases.filter(risk_level__in=["high", "critical"])[:20]:
        lines.append(f"- {case.code} ({case.risk_level})")
    body = "\n".join(lines)
    response = HttpResponse(body, content_type="text/plain; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="tunisian-hope-report.txt"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def platform_audit_logs(request):
    _seed_demo_data()
    rows = []
    for log in AuditLog.objects.select_related("case", "actor").all()[:200]:
        rows.append(
            {
                "id": f"case-{log.id}",
                "timestamp": log.timestamp.isoformat(),
                "user": log.actor.username if log.actor else "system",
                "role": _frontend_role(getattr(log.actor, "role", "operator"))
                if log.actor
                else "System",
                "action": log.action,
                "affected_id": log.case.code,
                "domain": "Follow-up",
                "result": "Success" if log.result == "success" else "Blocked",
                "block_reason": log.reason,
            }
        )
    for log in PlatformAuditLog.objects.all()[:200]:
        rows.append(
            {
                "id": f"plat-{log.id}",
                "timestamp": log.timestamp.isoformat(),
                "user": log.actor_name or "system",
                "role": _frontend_role(log.actor_role) if log.actor_role else "System",
                "action": log.action,
                "affected_id": log.affected_id,
                "domain": "Digital" if log.domain == "digital" else "Follow-up",
                "result": "Success" if log.result == "success" else "Blocked",
                "block_reason": log.reason,
            }
        )
    rows.sort(key=lambda r: r["timestamp"], reverse=True)
    return Response(rows[:300])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def global_search(request):
    _seed_demo_data()
    q = (request.GET.get("q") or "").strip().lower()
    if len(q) < 2:
        return Response({"cases": [], "profiles": []})

    cases = [
        {"code": c.code, "label": f"{c.code} — {c.school_or_center}", "risk_level": c.risk_level}
        for c in Case.objects.filter(code__icontains=q)[:8]
    ]
    profiles = [
        {"code": p.code, "label": f"{p.code} — {p.school}", "risk_level": p.risk_level}
        for p in YouthProfile.objects.filter(code__icontains=q)[:8]
    ]
    if not cases and not profiles:
        cases = [
            {"code": c.code, "label": f"{c.code} — {c.school_or_center}", "risk_level": c.risk_level}
            for c in Case.objects.filter(school_or_center__icontains=q)[:8]
        ]
        profiles = [
            {"code": p.code, "label": f"{p.code} — {p.school}", "risk_level": p.risk_level}
            for p in YouthProfile.objects.filter(school__icontains=q)[:8]
        ]
    return Response({"cases": cases, "profiles": profiles})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scenario3_send_action(request):
    _seed_demo_data()
    role = _role_from_request(request)
    profile_id = request.data.get("profile")
    profile_code = "Y-UNKNOWN"
    if profile_id:
        profile = YouthProfile.objects.filter(pk=profile_id).first()
        if profile:
            profile_code = profile.code
            recent = profile.assessments.filter(
                submitted_at__gte=timezone.now() - timedelta(hours=24)
            ).count()
            if recent >= 2:
                _log_platform(
                    request,
                    "Assessment ingest",
                    profile.code,
                    "digital",
                    "failure",
                    "Duplicate assessment submission within 24h",
                )
                return Response(
                    {
                        "detail": "Assessment conflict — duplicate submission within 24h.",
                    },
                    status=status.HTTP_409_CONFLICT,
                )

    if role not in {"counselor", "admin", "supervisor"}:
        _log_platform(
            request,
            "Send awareness action",
            profile_code,
            "digital",
            "failure",
            f"Role '{role}' cannot send awareness actions.",
        )
        return Response(
            {"detail": "Only counselor/admin roles can send awareness actions."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = AwarenessActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    action = serializer.save()
    _log_platform(
        request,
        "Awareness action sent",
        action.profile.code,
        "digital",
        "success",
        action.rationale[:200],
    )
    return Response(AwarenessActionSerializer(action).data, status=status.HTTP_201_CREATED)
