from django.contrib import admin
from .models import Session, Alert, InterventionPlan, RiskThresholdConfig


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['case', 'scheduled_date', 'status', 'recorded_by']
    list_filter = ['status']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['case', 'alert_type', 'is_resolved', 'created_at']
    list_filter = ['alert_type', 'is_resolved']


@admin.register(InterventionPlan)
class InterventionPlanAdmin(admin.ModelAdmin):
    list_display = ['case', 'frequency', 'start_date', 'is_active']


@admin.register(RiskThresholdConfig)
class RiskThresholdConfigAdmin(admin.ModelAdmin):
    list_display = ['high_risk_threshold', 'critical_risk_threshold',
                    'missed_sessions_before_alert', 'updated_at']