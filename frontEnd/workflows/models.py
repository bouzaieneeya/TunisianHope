from django.db import models
from django.conf import settings
from django.utils import timezone
from cases.models import Case
import logging

logger = logging.getLogger('workflows')


class RiskThresholdConfig(models.Model):
    """Seuils configurables par le superviseur — obligatoire selon cahier des charges."""
    high_risk_threshold = models.FloatField(
        default=50.0,
        verbose_name='Seuil risque élevé (score)'
    )
    critical_risk_threshold = models.FloatField(
        default=75.0,
        verbose_name='Seuil risque critique (score)'
    )
    missed_sessions_before_alert = models.IntegerField(
        default=2,
        verbose_name='Séances manquées avant alerte'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Modifié par'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuration des seuils'

    @classmethod
    def get_current(cls):
        """Retourne la config active (crée une par défaut si absente)."""
        config, _ = cls.objects.get_or_create(pk=1)
        return config

    def __str__(self):
        return (
            f"Seuils — élevé: {self.high_risk_threshold} | "
            f"critique: {self.critical_risk_threshold} | "
            f"séances manquées: {self.missed_sessions_before_alert}"
        )


class Session(models.Model):
    """Séance de suivi psychologique."""
    STATUS_CHOICES = [
        ('scheduled', 'Planifiée'),
        ('present',   'Présent'),
        ('absent',    'Absent'),
        ('cancelled', 'Annulée'),
    ]

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name='Cas'
    )
    scheduled_date = models.DateField(verbose_name='Date planifiée')
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='scheduled',
        verbose_name='Statut'
    )
    notes = models.TextField(blank=True, verbose_name='Notes')
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Enregistré par'
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_date']
        verbose_name = 'Séance'
        verbose_name_plural = 'Séances'

    def __str__(self):
        return (
            f"Séance {self.case.code} — "
            f"{self.scheduled_date} ({self.get_status_display()})"
        )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Déclenchement automatique d'alerte si absent
        if self.status == 'absent':
            self._check_and_trigger_alert()

    def _check_and_trigger_alert(self):
        """Vérifie le nombre de séances manquées et crée une alerte si nécessaire."""
        config = RiskThresholdConfig.get_current()
        missed_count = Session.objects.filter(
            case=self.case,
            status='absent'
        ).count()

        if missed_count >= config.missed_sessions_before_alert:
            # Éviter les doublons d'alertes actives
            already_exists = Alert.objects.filter(
                case=self.case,
                alert_type='missed_session',
                is_resolved=False
            ).exists()

            if not already_exists:
                Alert.objects.create(
                    case=self.case,
                    alert_type='missed_session',
                    explanation=(
                        f"Le jeune a manqué {missed_count} séance(s). "
                        f"Seuil configuré : {config.missed_sessions_before_alert}. "
                        f"Une action de suivi ou de référencement est recommandée."
                    )
                )
                logger.warning(
                    f"ALERTE créée — Cas {self.case.code} : "
                    f"{missed_count} séances manquées"
                )


class Alert(models.Model):
    """Alerte générée automatiquement ou manuellement."""
    ALERT_TYPE_CHOICES = [
        ('missed_session', 'Séance manquée'),
        ('high_risk',      'Risque élevé détecté'),
        ('no_followup',    'Absence de suivi prolongée'),
    ]

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='alerts',
        verbose_name='Cas'
    )
    alert_type = models.CharField(
        max_length=30,
        choices=ALERT_TYPE_CHOICES,
        verbose_name='Type d\'alerte'
    )
    explanation = models.TextField(
        verbose_name='Explication (lisible par humain)'
    )
    is_resolved = models.BooleanField(default=False, verbose_name='Résolue')
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='resolved_alerts',
        verbose_name='Résolue par'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'

    def resolve(self, actor):
        """Résout l'alerte et log l'action."""
        self.is_resolved = True
        self.resolved_by = actor
        self.resolved_at = timezone.now()
        self.save()
        logger.info(
            f"Alerte résolue — Cas {self.case.code} "
            f"par {actor} à {self.resolved_at}"
        )

    def __str__(self):
        etat = "Résolue" if self.is_resolved else "Active"
        return f"{self.get_alert_type_display()} — {self.case.code} [{etat}]"


class InterventionPlan(models.Model):
    """Plan d'intervention créé par le superviseur."""
    FREQUENCY_CHOICES = [
        ('weekly',    'Hebdomadaire'),
        ('biweekly',  'Bimensuel'),
        ('monthly',   'Mensuel'),
    ]

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='intervention_plans',
        verbose_name='Cas'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Créé par'
    )
    objective = models.TextField(verbose_name='Objectif')
    actions = models.TextField(verbose_name='Actions planifiées')
    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        verbose_name='Fréquence des séances'
    )
    start_date = models.DateField(verbose_name='Date de début')
    end_date = models.DateField(null=True, blank=True, verbose_name='Date de fin')
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Plan d\'intervention'

    def __str__(self):
        return f"Plan intervention — {self.case.code} ({'Actif' if self.is_active else 'Terminé'})"