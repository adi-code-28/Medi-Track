const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  full_name: string;
  age?: number;
  blood_group?: string;
  conditions?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
}

export interface Vital {
  id: number;
  type: string;
  value: number;
  value_secondary?: number;
  unit: string;
  notes?: string;
  recorded_at: string;
  status: "normal" | "warning" | "critical";
}

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  reminder_times: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface Symptom {
  id: number;
  name: string;
  severity: number;
  notes?: string;
  recorded_at: string;
}

export interface DashboardStats {
  vitals_count: number;
  medicines_active: number;
  adherence_pct: number;
  symptoms_this_week: number;
  latest_bp?: Vital;
}

export interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
}

export interface PrescriptionOCRResult {
  medicines: ExtractedMedicine[];
  doctor_name?: string;
  confidence: "high" | "medium" | "low";
  raw_notes?: string;
}

export interface InsightResponse {
  summary: string;
  action_items: string[];
  generated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  sources: string[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem("meditrack_token");
}

export function setToken(token: string) {
  localStorage.setItem("meditrack_token", token);
}

export function clearToken() {
  localStorage.removeItem("meditrack_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, err.detail || "Request failed");
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return res as unknown as T;
}

export const api = {
  register: (email: string, password: string, full_name: string) =>
    request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name }),
    }),

  login: async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new ApiError(res.status, err.detail);
    }
    return res.json() as Promise<{ access_token: string }>;
  },

  me: () => request<User>("/api/auth/me"),
  updateMe: (data: Partial<User>) =>
    request<User>("/api/auth/me", { method: "PATCH", body: JSON.stringify(data) }),

  dashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  vitals: (type?: string) =>
    request<Vital[]>(`/api/vitals${type ? `?type=${type}` : ""}`),
  createVital: (data: Omit<Vital, "id" | "status" | "recorded_at"> & { recorded_at?: string }) =>
    request<Vital>("/api/vitals", { method: "POST", body: JSON.stringify(data) }),
  deleteVital: (id: number) =>
    request<{ ok: boolean }>(`/api/vitals/${id}`, { method: "DELETE" }),

  medicines: () => request<Medicine[]>("/api/medicines"),
  createMedicine: (data: {
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    reminder_times?: string;
  }) => request<Medicine>("/api/medicines", { method: "POST", body: JSON.stringify(data) }),
  toggleMedicine: (id: number) =>
    request<{ is_active: boolean }>(`/api/medicines/${id}/toggle`, { method: "PATCH" }),
  deleteMedicine: (id: number) =>
    request<{ ok: boolean }>(`/api/medicines/${id}`, { method: "DELETE" }),
  logMedicine: (data: {
    medicine_id: number;
    scheduled_at: string;
    status: "taken" | "missed" | "skipped";
    notes?: string;
  }) => request("/api/medicines/logs", { method: "POST", body: JSON.stringify(data) }),

  symptoms: () => request<Symptom[]>("/api/symptoms"),
  createSymptom: (data: { name: string; severity: number; notes?: string }) =>
    request<Symptom>("/api/symptoms", { method: "POST", body: JSON.stringify(data) }),
  deleteSymptom: (id: number) =>
    request<{ ok: boolean }>(`/api/symptoms/${id}`, { method: "DELETE" }),

  scanPrescription: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<PrescriptionOCRResult>("/api/ocr/prescription", {
      method: "POST",
      body: form,
    });
  },
  confirmPrescription: (medicines: ExtractedMedicine[]) =>
    request("/api/ocr/confirm", { method: "POST", body: JSON.stringify({ medicines }) }),

  insights: () => request<InsightResponse>("/api/ai/insights"),
  chat: (message: string, history: ChatMessage[]) =>
    request<ChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  downloadReport: async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/ai/report/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError(res.status, "Failed to download report");
    return res.blob();
  },

  sos: (userId: number) => request<User>(`/api/sos/${userId}`),
};
