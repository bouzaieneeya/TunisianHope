from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="YouthProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=20, unique=True)),
                ("age_group", models.CharField(max_length=20)),
                ("school", models.CharField(max_length=120)),
                ("counselor", models.CharField(max_length=120)),
                ("risk_level", models.CharField(choices=[("low", "Low"), ("moderate", "Moderate"), ("high", "High"), ("critical", "Critical")], default="low", max_length=20)),
                ("status", models.CharField(choices=[("active", "Active"), ("pending_review", "Pending Review"), ("closed", "Closed")], default="active", max_length=20)),
                ("last_assessment_date", models.DateField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["code"]},
        ),
        migrations.CreateModel(
            name="AwarenessAction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action_type", models.CharField(choices=[("informational", "Informational"), ("preventive", "Preventive"), ("referral", "Referral")], max_length=20)),
                ("channel", models.CharField(choices=[("in_person", "In-person"), ("online", "Online"), ("sms", "SMS")], max_length=20)),
                ("counselor", models.CharField(max_length=120)),
                ("rationale", models.TextField()),
                ("status", models.CharField(choices=[("pending", "Pending"), ("sent", "Sent"), ("acknowledged", "Acknowledged"), ("escalated", "Escalated"), ("no_response", "No response")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="actions", to="api.youthprofile")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="DigitalAssessment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("submitted_by", models.CharField(max_length=120)),
                ("risk_score", models.FloatField(default=0.0)),
                ("risk_level", models.CharField(choices=[("low", "Low"), ("moderate", "Moderate"), ("high", "High"), ("critical", "Critical")], max_length=20)),
                ("submitted_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("details", models.JSONField(blank=True, default=dict)),
                ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assessments", to="api.youthprofile")),
            ],
            options={"ordering": ["-submitted_at"]},
        ),
    ]
