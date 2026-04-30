from django.db import models
from django.conf import settings
import logging

logger = logging.getLogger('cases')


class Case(models.Model):

    STATUS_CHOICES = [
        ('new', 'Nouveau'),
        ('in_review', 'En revue'),
        ('active', 'Actif'),
        ('followup', 'Suivi'),
        ('alert', 'Alerte'),
        ('closed', 'Fermé'),
    ]

    RISK_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
        ('critical', 'Critique'),
    ]

    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]

    # Transitions autorisées — machine d'états
    ALLOWED_TRANSITIONS = {
        'new':       ['in_review'],
        'in_review': ['active', 'closed'],
        'active':    ['followup'],
        'followup':  ['alert', 'closed'],
        'alert':     ['followup', 'closed'],
        'closed':    [],  # état final
    }

    # Identifiant anonyme (jamais le vrai nom)
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Code du cas'
    )
    age = models.IntegerField(verbose_name='Âge')
    gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        verbose_name='Genre'
    )
    region = models.CharField(max_length=100, verbose_name='Région')
    school_or_center = models.CharField(
        max_length=200,
        verbose_name='École / Centre'
    )

    # Score et risque
    initial_score = models.FloatField(
        default=0.0,
        verbose_name='Score initial (0-100)'
    )
    risk_level = models.CharField(
        max_length=10,
        choices=RISK_CHOICES,
        default='low',
        verbose_name='Niveau de risque'
    )

    # Statut workflow
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        verbose_name='Statut'
    )

    # Acteurs
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_cases',
        verbose_name='Créé par'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_cases',
        verbose_name='Assigné à'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, verbose_name='Notes')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cas'
        verbose_name_plural = 'Cas'

    def __str__(self):
        return f"Cas {self.code} — {self.get_status_display()}"

    def calculate_risk(self, high_threshold=50.0, critical_threshold=75.0):
        """
        Règle explicable — pas de boîte noire.
        Retourne le niveau de risque selon le score.
        """
        score = self.initial_score
        if score >= critical_threshold:
            return 'critical'
        elif score >= high_threshold:
            return 'high'
        elif score >= 25.0:
            return 'medium'
        return 'low'

    def can_transition_to(self, new_status):
        """Vérifie si la transition est autorisée."""
        return new_status in self.ALLOWED_TRANSITIONS.get(self.status, [])

    def transition_to(self, new_status, actor, reason=''):
        """
        Effectue une transition de statut avec log d'audit.
        Lève ValueError si la transition est interdite.
        """
        if not self.can_transition_to(new_status):
            msg = (
                f"Transition interdite : {self.status} → {new_status} "
                f"pour le cas {self.code}"
            )
            AuditLog.objects.create(
                case=self,
                actor=actor,
                action=f"Tentative transition → {new_status}",
                result='failure',
                reason=msg,
            )
            logger.warning(msg)
            raise ValueError(msg)

        old_status = self.status
        self.status = new_status
        self.save()

        AuditLog.objects.create(
            case=self,
            actor=actor,
            action=f"Transition {old_status} → {new_status}",
            result='success',
            reason=reason,
        )
        logger.info(
            f"Cas {self.code} : {old_status} → {new_status} "
            f"par {actor} | raison: {reason}"
        )
        return True


class AuditLog(models.Model):
    """
    Journal d'audit — chaque action est tracée.
    Obligatoire selon le cahier des charges.
    """
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    action = models.CharField(max_length=200)
    result = models.CharField(
        max_length=10,
        choices=[('success', 'Succès'), ('failure', 'Échec')]
    )
    reason = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Journal d\'audit'

    def __str__(self):
        return (
            f"[{self.timestamp:%Y-%m-%d %H:%M}] "
            f"{self.actor} — {self.action} ({self.result})"
        )