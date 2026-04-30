from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'center', 'is_active']
    list_filter = ['role', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Rôle et Centre', {
            'fields': ('role', 'phone', 'center')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Rôle et Centre', {
            'fields': ('role', 'phone', 'center')
        }),
    )