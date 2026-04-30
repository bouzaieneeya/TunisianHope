from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('operator', 'Opérateur'),
        ('supervisor', 'Superviseur'),
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='operator',
        verbose_name='Rôle'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Téléphone'
    )
    center = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Centre / École'
    )

    def is_operator(self):
        return self.role == 'operator'

    def is_supervisor(self):
        return self.role == 'supervisor'

    def is_admin_user(self):
        return self.role == 'admin'

    def can_validate_case(self):
        return self.role in ['supervisor', 'admin']

    def can_configure_thresholds(self):
        return self.role in ['supervisor', 'admin']

    def can_export_reports(self):
        return self.role in ['supervisor', 'admin']

    def can_manage_users(self):
        return self.role == 'admin'

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"