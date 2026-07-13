import axios from "axios";

export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Cache-Control": "no-store" },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // redirect to login if not already there
      if (!window.location.pathname.startsWith("/login")) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirect}`;
      }
    }
    const msg = err.response?.data?.message || err.message || "请求失败";
    return Promise.reject(new Error(msg));
  },
);

// ---- types ----
export interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}
export interface AccountListItem {
  id: number;
  username: string;
  remark: string;
  status: 0 | 1;
  uploaded_at: string;
  used_at?: string | null;
  uploaded_by: string;
  extracted_by?: string;
  password_set: boolean;
  cookie_set: boolean;
  refresh_set: boolean;
}
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
export interface AccountDetail {
  id: number;
  username: string;
  password?: string;
  cookie?: string;
  refresh_tokens?: { app_name: string; refresh_token: string }[];
  remark?: string;
  uploaded_at: string;
  used_at?: string | null;
}
export interface ExtractedAccount extends AccountDetail {}
export interface ApiKey {
  id: number;
  name: string;
  key_prefix: string;
  enabled: boolean;
  quota: number;
  used_count: number;
  last_used_at?: string | null;
  permissions: string;
  created_at: string;
}
export interface Stats {
  available: number;
  used: number;
  today_upload: number;
  expiring_soon: number;
  ttl_after_extract: number;
  max_age_unused: number;
}

async function unwrap<T>(p: Promise<{ data: Envelope<T> }>): Promise<T> {
  const res = await p;
  if (!res.data.success) throw new Error(res.data.message || "操作失败");
  return res.data.data as T;
}

export const API = {
  setupStatus: () =>
    unwrap<{ needs_setup: boolean }>(api.get("/api/setup/status")),
  setup: (username: string, password: string) =>
    unwrap<{ username: string }>(api.post("/api/setup", { username, password })),
  login: (username: string, password: string) =>
    unwrap<{ id: number; username: string; role: string }>(
      api.post("/api/auth/login", { username, password }),
    ),
  logout: () => unwrap(api.post("/api/auth/logout")),
  self: () =>
    unwrap<{ id: number; username: string; role: string } | null>(
      api.get("/api/user/self").catch(() => ({ data: { success: true, data: null } })),
    ),
  accounts: (params: Record<string, unknown>) =>
    unwrap<Paged<AccountListItem>>(api.get("/api/accounts", { params })),
  accountDetail: (id: number) =>
    unwrap<AccountDetail>(api.get(`/api/account/${id}`)),
  deleteAccount: (id: number) => unwrap(api.delete(`/api/account/${id}`)),
  upload: (body: unknown) => unwrap(api.post("/api/account", body)),
  uploadBatch: (items: unknown[]) => unwrap(api.post("/api/account/batch", { items })),
  extract: (body: unknown) =>
    unwrap<{ items: ExtractedAccount[]; count: number } | null>(
      api.post("/api/account/extract", body),
    ),
  apiKeys: () => unwrap<ApiKey[]>(api.get("/api/api-keys")),
  createApiKey: (body: unknown) =>
    unwrap<{ id: number; name: string; key: string }>(api.post("/api/api-keys", body)),
  updateApiKey: (id: number, body: unknown) => unwrap(api.put(`/api/api-keys/${id}`, body)),
  deleteApiKey: (id: number) => unwrap(api.delete(`/api/api-keys/${id}`)),
  settings: () => unwrap<Record<string, string>>(api.get("/api/settings/all")),
  updateSettings: (body: Record<string, string>) =>
    unwrap<Record<string, string>>(api.put("/api/settings", body)),
  stats: () => unwrap<Stats>(api.get("/api/dashboard/stats")),
  logs: (params: Record<string, unknown>) =>
    unwrap<Paged<{ id: number; action: string; target_id: string; actor: string; detail: string; created_at: string }>>(
      api.get("/api/logs", { params }),
    ),
};
