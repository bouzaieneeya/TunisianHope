from rest_framework import serializers

from api.models import (
    AwarenessAction,
    DigitalAssessment,
    PlatformAuditLog,
    SystemPolicy,
    YouthObservation,
    YouthProfile,
)
from cases.models import AuditLog, Case
from workflows.models import Alert, RiskThresholdConfig, Session


class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = ["id", "code", "status", "risk_level", "initial_score"]


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["id", "case", "scheduled_date", "status", "notes"]


class AlertSerializer(serializers.ModelSerializer):
    case_code = serializers.CharField(source="case.code", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "case",
            "case_code",
            "alert_type",
            "explanation",
            "is_resolved",
            "created_at",
        ]


class RiskThresholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskThresholdConfig
        fields = [
            "high_risk_threshold",
            "critical_risk_threshold",
            "missed_sessions_before_alert",
            "updated_at",
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ["id", "action", "result", "reason", "timestamp", "actor_name"]

    def get_actor_name(self, obj):
        return obj.actor.username if obj.actor else "system"


class PlatformAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAuditLog
        fields = [
            "id",
            "actor_name",
            "actor_role",
            "action",
            "affected_id",
            "domain",
            "result",
            "reason",
            "timestamp",
        ]


class SystemPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPolicy
        fields = [
            "awareness_opt_in",
            "auto_assign_counselor",
            "anonymize_exports",
            "updated_at",
        ]


class YouthProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = YouthProfile
        fields = [
            "id",
            "code",
            "age_group",
            "school",
            "counselor",
            "risk_level",
            "status",
            "last_assessment_date",
        ]


class YouthObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = YouthObservation
        fields = ["id", "profile", "text", "actor_name", "created_at"]


class DigitalAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DigitalAssessment
        fields = [
            "id",
            "profile",
            "submitted_by",
            "risk_score",
            "risk_level",
            "submitted_at",
            "details",
        ]


class AwarenessActionSerializer(serializers.ModelSerializer):
    profile_code = serializers.CharField(source="profile.code", read_only=True)
    risk_level = serializers.CharField(source="profile.risk_level", read_only=True)

    class Meta:
        model = AwarenessAction
        fields = [
            "id",
            "profile",
            "profile_code",
            "risk_level",
            "action_type",
            "channel",
            "counselor",
            "status",
            "rationale",
            "created_at",
        ]
        read_only_fields = ["id", "profile_code", "risk_level", "created_at"]
