import type { Role } from "@/lib/mockData";



const ROLE_MAP: Record<Role, string> = {

  Operator: "operator",

  Counselor: "counselor",

  Admin: "admin",

};



let csrfToken: string | null = null;



function maybeStoreCsrfToken(payload: any) {

  if (payload && typeof payload === "object" && typeof payload.csrf_token === "string") {

    csrfToken = payload.csrf_token;

  }

}



function buildHeaders(init?: RequestInit, includeRole?: string) {

  const headers: Record<string, string> = {

    "Content-Type": "application/json",

    ...(init?.headers as Record<string, string> | undefined),

  };

  if (includeRole) headers["X-User-Role"] = includeRole;

  const method = (init?.method ?? "GET").toUpperCase();

  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) {

    headers["X-CSRFToken"] = csrfToken;

  }

  return headers;

}



async function request<T>(path: string, role: Role, init?: RequestInit): Promise<T> {

  const res = await fetch(`/api${path}`, {

    ...init,

    credentials: "include",

    headers: buildHeaders(init, ROLE_MAP[role]),

  });

  if (!res.ok) {

    const text = await res.text();

    throw new Error(text || `Request failed: ${res.status}`);

  }

  if (res.status === 204) return undefined as T;

  const payload = (await res.json()) as T;

  maybeStoreCsrfToken(payload);

  return payload;

}



async function requestNoRole<T>(path: string, init?: RequestInit): Promise<T> {

  const res = await fetch(`/api${path}`, {

    ...init,

    credentials: "include",

    headers: buildHeaders(init),

  });

  if (!res.ok) {

    const text = await res.text();

    throw new Error(text || `Request failed: ${res.status}`);

  }

  if (res.status === 204) return undefined as T;

  const payload = (await res.json()) as T;

  maybeStoreCsrfToken(payload);

  return payload;

}



async function downloadFile(path: string, role: Role, filename: string) {

  const res = await fetch(`/api${path}`, {

    credentials: "include",

    headers: buildHeaders({ method: "GET" }, ROLE_MAP[role]),

  });

  if (!res.ok) {

    const text = await res.text();

    throw new Error(text || `Download failed: ${res.status}`);

  }

  const blob = await res.blob();

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = filename;

  anchor.click();

  URL.revokeObjectURL(url);

}



export const backendApi = {

  authLogin: (payload: { username: string; password: string }) =>

    requestNoRole("/login/", {

      method: "POST",

      body: JSON.stringify(payload),

    }),

  authLogout: () =>

    requestNoRole("/logout/", {

      method: "GET",

    }),

  authMe: () => requestNoRole("/auth/me/"),

  usersList: () => requestNoRole("/users/"),

  usersCreate: (payload: {

    username: string;

    password: string;

    role: "operator" | "supervisor" | "admin";

    first_name?: string;

    last_name?: string;

    email?: string;

    phone?: string;

    center?: string;

  }) =>

    requestNoRole("/users/create/", {

      method: "POST",

      body: JSON.stringify(payload),

    }),

  usersUpdate: (

    userId: number,

    payload: Partial<{

      role: "operator" | "supervisor" | "admin";

      first_name: string;

      last_name: string;

      email: string;

      phone: string;

      center: string;

      password: string;

    }>,

  ) =>

    requestNoRole(`/users/${userId}/`, {

      method: "PATCH",

      body: JSON.stringify(payload),

    }),

  usersToggleActive: (userId: number, isActive: boolean) =>

    requestNoRole(`/users/${userId}/toggle-active/`, {

      method: "POST",

      body: JSON.stringify({ is_active: isActive }),

    }),

  settingsPoliciesGet: () => requestNoRole("/settings/policies/"),

  settingsPoliciesUpdate: (payload: {

    awareness_opt_in?: boolean;

    auto_assign_counselor?: boolean;

    anonymize_exports?: boolean;

  }) =>

    requestNoRole("/settings/policies/", {

      method: "PATCH",

      body: JSON.stringify(payload),

    }),

  reportsExportCsv: (role: Role) => downloadFile("/reports/export/?format=csv", role, "tunisian-hope-report.csv"),

  reportsExportPdf: (role: Role) =>
    downloadFile("/reports/export/?format=pdf", role, "tunisian-hope-report.pdf"),
  auditLogs: (role: Role) => request("/audit/logs/", role),
  globalSearch: (role: Role, q: string) =>
    request(`/search/?q=${encodeURIComponent(q)}`, role),
  scenario2Dashboard: (role: Role) => request("/scenario2/dashboard/", role),

  scenario2Alerts: (role: Role) => request("/scenario2/alerts/", role),

  scenario2UpdateAlert: (role: Role, alertId: number, action: "acknowledge" | "dismiss" | "escalate") =>

    request(`/scenario2/alerts/${alertId}/`, role, {

      method: "PATCH",

      body: JSON.stringify({ action }),

    }),

  scenario2Thresholds: (role: Role) => request("/scenario2/thresholds/", role),

  scenario2UpdateThresholds: (

    role: Role,

    payload: {

      high_risk_threshold?: number;

      critical_risk_threshold?: number;

      missed_sessions_before_alert?: number;

    },

  ) =>

    request("/scenario2/thresholds/", role, {

      method: "PATCH",

      body: JSON.stringify(payload),

    }),

  scenario2Cases: (role: Role) => request("/scenario2/cases/", role),

  scenario2CreateCase: (

    role: Role,

    payload: {

      age: number;

      gender?: string;

      region?: string;

      school_or_center?: string;

      initial_score?: number;

      risk_level?: string;

    },

  ) =>

    request("/scenario2/cases/", role, {

      method: "POST",

      body: JSON.stringify(payload),

    }),

  scenario2CaseDetail: (role: Role, caseCode: string) =>

    request(`/scenario2/cases/by-code/${caseCode}/`, role),

  scenario2CaseTimeline: (role: Role, caseId: number) =>

    request(`/scenario2/cases/${caseId}/timeline/`, role),

  scenario2AddNote: (role: Role, caseId: number, note: string) =>

    request(`/scenario2/cases/${caseId}/notes/`, role, {

      method: "POST",

      body: JSON.stringify({ note }),

    }),

  scenario2Sessions: (role: Role) => request("/scenario2/sessions/", role),

  scenario2CreateSession: (

    role: Role,

    caseId: number,

    payload: { scheduled_date: string; status: string; notes?: string },

  ) =>

    request(`/scenario2/cases/${caseId}/sessions/`, role, {

      method: "POST",

      body: JSON.stringify(payload),

    }),

  scenario2UpdateSession: (

    role: Role,

    sessionId: number,

    payload: { status: string; notes?: string },

  ) =>

    request(`/scenario2/sessions/${sessionId}/`, role, {

      method: "PATCH",

      body: JSON.stringify(payload),

    }),

  scenario2SendReminder: (role: Role, caseId: number, message?: string) =>

    request(`/scenario2/cases/${caseId}/reminder/`, role, {

      method: "POST",

      body: JSON.stringify({ message }),

    }),

  scenario3Profiles: (role: Role) => request("/scenario3/profiles/", role),

  scenario3CreateProfile: (

    role: Role,

    payload: {

      age_group: string;

      school: string;

      counselor?: string;

      risk_level?: string;

    },

  ) =>

    request("/scenario3/profiles/", role, {

      method: "POST",

      body: JSON.stringify(payload),

    }),

  scenario3ProfileDetail: (role: Role, profileCode: string) =>

    request(`/scenario3/profiles/${profileCode}/`, role),

  scenario3AssignCounselor: (role: Role, profileCode: string, counselor: string) =>

    request(`/scenario3/profiles/${profileCode}/assign/`, role, {

      method: "PATCH",

      body: JSON.stringify({ counselor }),

    }),

  scenario3AddObservation: (role: Role, profileCode: string, text: string) =>

    request(`/scenario3/profiles/${profileCode}/observations/`, role, {

      method: "POST",

      body: JSON.stringify({ text }),

    }),

  scenario3Actions: (role: Role) => request("/scenario3/actions/", role),

  scenario3UpdateAction: (

    role: Role,

    actionId: number,

    payload: { status: string; rationale?: string },

  ) =>

    request(`/scenario3/actions/${actionId}/`, role, {

      method: "PATCH",

      body: JSON.stringify(payload),

    }),

  scenario2TriggerReferral: (role: Role, caseId: number, reason?: string) =>

    request(`/scenario2/cases/${caseId}/referral/`, role, {

      method: "POST",

      body: reason ? JSON.stringify({ reason }) : undefined,

    }),

  scenario3SendAction: (

    role: Role,

    payload: {

      profile: number;

      action_type: string;

      channel: string;

      counselor: string;

      rationale: string;

      status?: string;

    },

  ) =>

    request("/scenario3/actions/send/", role, {

      method: "POST",

      body: JSON.stringify({ ...payload, status: payload.status ?? "pending" }),

    }),

};


