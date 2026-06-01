from django.conf import settings
from django.db import models
from django.utils import timezone


class YouthProfile(models.Model):
    RISK_CHOICES = [
        ("low", "Low"),
        ("moderate", "Moderate"),
        ("high", "High"),
        ("critical", "Critical"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("pending_review", "Pending Review"),
        ("closed", "Closed"),
    ]

    code = models.CharField(max_length=20, unique=True)
    age_group = models.CharField(max_length=20)
    school = models.CharField(max_length=120)
    counselor = models.CharField(max_length=120)
    risk_level = models.CharField(max_length=20, choices=RISK_CHOICES, default="low")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    last_assessment_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class DigitalAssessment(models.Model):
    profile = models.ForeignKey(
        YouthProfile, on_delete=models.CASCADE, related_name="assessments"
    )
    submitted_by = models.CharField(max_length=120)
    risk_score = models.FloatField(default=0.0)
    risk_level = models.CharField(max_length=20, choices=YouthProfile.RISK_CHOICES)
    submitted_at = models.DateTimeField(default=timezone.now)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-submitted_at"]


class YouthObservation(models.Model):
    profile = models.ForeignKey(
        YouthProfile, on_delete=models.CASCADE, related_name="observations"
    )
    text = models.TextField()
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    actor_name = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class SystemPolicy(models.Model):
    awareness_opt_in = models.BooleanField(default=True)
    auto_assign_counselor = models.BooleanField(default=True)
    anonymize_exports = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "System policies"

    @classmethod
    def get_current(cls):
        policy, _ = cls.objects.get_or_create(pk=1)
        return policy


class PlatformAuditLog(models.Model):
    """Cross-domain audit trail (Scenario 2 cases + Scenario 3 youth)."""

    DOMAIN_CHOICES = [
        ("followup", "Follow-up"),
        ("digital", "Digital"),
    ]
    RESULT_CHOICES = [
        ("success", "Success"),
        ("failure", "Failure"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    actor_name = models.CharField(max_length=120, blank=True)
    actor_role = models.CharField(max_length=40, blank=True)
    action = models.CharField(max_length=200)
    affected_id = models.CharField(max_length=40)
    domain = models.CharField(max_length=20, choices=DOMAIN_CHOICES)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    reason = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]


class AwarenessAction(models.Model):
    TYPE_CHOICES = [
        ("informational", "Informational"),
        ("preventive", "Preventive"),
        ("referral", "Referral"),
    ]
    CHANNEL_CHOICES = [
        ("in_person", "In-person"),
        ("online", "Online"),
        ("sms", "SMS"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("acknowledged", "Acknowledged"),
        ("escalated", "Escalated"),
        ("no_response", "No response"),
    ]

    profile = models.ForeignKey(
        YouthProfile, on_delete=models.CASCADE, related_name="actions"
    )
    action_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    counselor = models.CharField(max_length=120)
    rationale = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
