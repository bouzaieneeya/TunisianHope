from django.contrib import admin
from .models import Case, AuditLog


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ['code', 'age', 'gender', 'region', 'risk_level', 'status', 'created_at']
    list_filter = ['status', 'risk_level', 'gender', 'region']
    search_fields = ['code', 'region', 'school_or_center']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'actor', 'case', 'action', 'result']
    list_filter = ['result']
    readonly_fields = ['timestamp', 'actor', 'case', 'action', 'result', 'reason']