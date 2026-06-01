from django.urls import path



from api import views



urlpatterns = [

    path("login/", views.auth_login, name="login"),

    path("logout/", views.auth_logout, name="logout"),

    path("users/create/", views.create_user, name="create_user"),

    path("users/", views.user_list, name="user_list"),

    path("users/<int:user_id>/", views.update_user, name="update_user"),

    path("users/<int:user_id>/toggle-active/", views.toggle_user_active, name="toggle_user_active"),

    path("auth/login/", views.auth_login),

    path("auth/logout/", views.auth_logout),

    path("auth/me/", views.auth_me),

    path("settings/policies/", views.system_policies),

    path("reports/export/", views.reports_export),
    path("audit/logs/", views.platform_audit_logs),
    path("search/", views.global_search),

    path("scenario2/dashboard/", views.scenario2_dashboard),

    path("scenario2/thresholds/", views.scenario2_thresholds),

    path("scenario2/alerts/", views.scenario2_alerts),

    path("scenario2/alerts/<int:alert_id>/", views.scenario2_update_alert),

    path("scenario2/cases/", views.scenario2_cases),

    path("scenario2/cases/by-code/<str:case_code>/", views.scenario2_case_detail),

    path("scenario2/cases/<int:case_id>/sessions/", views.scenario2_create_session),

    path("scenario2/cases/<int:case_id>/notes/", views.scenario2_add_note),

    path("scenario2/cases/<int:case_id>/reminder/", views.scenario2_send_reminder),

    path("scenario2/cases/<int:case_id>/timeline/", views.scenario2_case_timeline),

    path("scenario2/cases/<int:case_id>/referral/", views.scenario2_trigger_referral),

    path("scenario2/sessions/", views.scenario2_sessions_list),

    path("scenario2/sessions/<int:session_id>/", views.scenario2_update_session),

    path("scenario3/profiles/", views.scenario3_profiles),

    path("scenario3/profiles/<str:profile_code>/", views.scenario3_profile_detail),

    path("scenario3/profiles/<str:profile_code>/assign/", views.scenario3_update_profile),

    path(

        "scenario3/profiles/<str:profile_code>/observations/",

        views.scenario3_add_observation,

    ),

    path("scenario3/actions/", views.scenario3_actions),

    path("scenario3/actions/<int:action_id>/", views.scenario3_update_action),

    path("scenario3/actions/send/", views.scenario3_send_action),

]


