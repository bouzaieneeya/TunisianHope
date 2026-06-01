from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from api.models import AwarenessAction, DigitalAssessment, PlatformAuditLog, YouthObservation, YouthProfile
from cases.models import AuditLog, Case
from workflows.models import Alert, RiskThresholdConfig, Session


class ScenarioApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_user(
            username="admin_test",
            password="Admin@123",
            role="admin",
        )
        self.operator_user = User.objects.create_user(
            username="operator_test",
            password="Operator@123",
            role="operator",
        )
        self.client.force_authenticate(user=self.admin_user)
        self.case = Case.objects.create(
            code="C-TEST-1",
            age=16,
            gender="F",
            region="Tunis",
            school_or_center="Test Center",
            initial_score=60,
            risk_level="high",
            status="active",
        )

    def test_s2_dashboard_available(self):
        response = self.client.get("/api/scenario2/dashboard/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("active_cases", response.json())

    def test_s2_referral_blocked_for_operator(self):
        self.client.force_authenticate(user=self.operator_user)
        response = self.client.post(
            f"/api/scenario2/cases/{self.case.id}/referral/",
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            AuditLog.objects.filter(
                case=self.case,
                action="Blocked action: trigger_referral",
                result="failure",
            ).exists()
        )

    def test_s3_action_blocked_for_operator(self):
        self.client.force_authenticate(user=self.operator_user)
        response = self.client.post(
            "/api/scenario3/actions/send/",
            {
                "profile": 1,
                "action_type": "preventive",
                "channel": "online",
                "counselor": "Sara M.",
                "status": "pending",
                "rationale": "test",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_absent_session_triggers_alert(self):
        case = Case.objects.create(
            code="C-ALERT-1",
            age=16,
            gender="F",
            region="Tunis",
            school_or_center="Test Center",
            initial_score=60,
            risk_level="high",
            status="active",
        )
        config = RiskThresholdConfig.get_current()
        config.missed_sessions_before_alert = 1
        config.save()

        Session.objects.create(
            case=case,
            scheduled_date="2026-04-01",
            status="absent",
        )

        self.assertTrue(Alert.objects.filter(case=case).exists())

    def test_no_duplicate_alerts(self):
        case = Case.objects.create(
            code="C-ALERT-2",
            age=17,
            gender="M",
            region="Sfax",
            school_or_center="Test Center",
            initial_score=70,
            risk_level="high",
            status="active",
        )
        config = RiskThresholdConfig.get_current()
        config.missed_sessions_before_alert = 2
        config.save()

        Session.objects.create(case=case, scheduled_date="2026-04-01", status="absent")
        Session.objects.create(case=case, scheduled_date="2026-04-08", status="absent")

        self.assertEqual(
            Alert.objects.filter(case=case, alert_type="missed_session", is_resolved=False).count(),
            1,
        )

    def test_case_timeline_logs_actions(self):
        case = Case.objects.create(
            code="C-TIMELINE-1",
            age=15,
            gender="F",
            region="Sousse",
            school_or_center="Test Center",
            initial_score=40,
            risk_level="medium",
            status="active",
        )
        AuditLog.objects.create(
            case=case,
            actor=None,
            action="Test timeline action",
            result="success",
            reason="pytest audit entry",
        )

        response = self.client.get(f"/api/scenario2/cases/{case.id}/timeline/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data) > 0)
        self.assertEqual(data[0]["action"], "Test timeline action")

    def test_case_add_note_persists(self):
        response = self.client.post(
            f"/api/scenario2/cases/{self.case.id}/notes/",
            {"note": "Patient showed improvement."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            AuditLog.objects.filter(
                case=self.case, action="Clinical note added", reason="Patient showed improvement."
            ).exists()
        )

    def test_s3_action_blocked_for_operator_on_valid_profile(self):
        profile = YouthProfile.objects.create(
            code="Y-BLOCK-1",
            age_group="15-17",
            school="Test School",
            counselor="Sara M.",
            risk_level="moderate",
        )
        self.client.force_authenticate(user=self.operator_user)
        before = AwarenessAction.objects.filter(profile=profile).count()
        response = self.client.post(
            "/api/scenario3/actions/send/",
            {
                "profile": profile.id,
                "action_type": "preventive",
                "channel": "online",
                "counselor": "Sara M.",
                "status": "pending",
                "rationale": "operator should be blocked",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(AwarenessAction.objects.filter(profile=profile).count(), before)

    def test_malformed_case_intake_returns_400_and_audit(self):
        response = self.client.post(
            "/api/scenario2/cases/",
            {"age": 99, "region": "", "school_or_center": ""},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("errors", response.json())
        self.assertTrue(
            PlatformAuditLog.objects.filter(
                action="Intake validation", result="failure"
            ).exists()
        )

    def test_s3_operator_block_writes_platform_audit(self):
        profile = YouthProfile.objects.create(
            code="Y-AUDIT-1",
            age_group="15-17",
            school="Test School",
            counselor="Sara M.",
            risk_level="moderate",
        )
        self.client.force_authenticate(user=self.operator_user)
        response = self.client.post(
            "/api/scenario3/actions/send/",
            {
                "profile": profile.id,
                "action_type": "preventive",
                "channel": "online",
                "counselor": "Sara M.",
                "status": "pending",
                "rationale": "blocked",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(
            PlatformAuditLog.objects.filter(
                action="Send awareness action",
                affected_id=profile.code,
                result="failure",
            ).exists()
        )

    def test_s3_assessment_conflict_returns_409(self):
        profile = YouthProfile.objects.create(
            code="Y-CONFLICT-1",
            age_group="15-17",
            school="Test School",
            counselor="Sara M.",
            risk_level="high",
        )
        DigitalAssessment.objects.create(
            profile=profile, submitted_by="Sara M.", risk_score=7.0, risk_level="high"
        )
        DigitalAssessment.objects.create(
            profile=profile, submitted_by="Sara M.", risk_score=7.5, risk_level="high"
        )
        response = self.client.post(
            "/api/scenario3/actions/send/",
            {
                "profile": profile.id,
                "action_type": "preventive",
                "channel": "online",
                "counselor": "Sara M.",
                "status": "pending",
                "rationale": "should conflict",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertTrue(
            PlatformAuditLog.objects.filter(
                action="Assessment ingest",
                affected_id=profile.code,
                result="failure",
            ).exists()
        )

    def test_global_search_finds_case(self):
        response = self.client.get("/api/search/?q=C-TEST")
        self.assertEqual(response.status_code, 200)
        codes = [c["code"] for c in response.json().get("cases", [])]
        self.assertIn(self.case.code, codes)

    def test_dashboard_includes_adherence_and_sessions(self):
        response = self.client.get("/api/scenario2/dashboard/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("adherence_weeks", body)
        self.assertIn("upcoming_sessions", body)

    def test_youth_add_observation_persists(self):
        profile = YouthProfile.objects.create(
            code="Y-TEST-1",
            age_group="15-17",
            school="Test School",
            counselor="Sara M.",
            risk_level="moderate",
        )
        response = self.client.post(
            f"/api/scenario3/profiles/{profile.code}/observations/",
            {"text": "Increased screen time after exams."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(YouthObservation.objects.filter(profile=profile).count(), 1)
