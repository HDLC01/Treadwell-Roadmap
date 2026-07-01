// Typed fetch wrapper. Same-origin; the session cookie rides along
// (credentials: "include"). Mutating requests send X-Requested-With as a
// lightweight CSRF signal the backend checks.

import type {
  DocKind, DocPage, Role, Status, SystemDetail, SystemSummary, User,
} from "./types";
import { getAccessToken, DEV_TOKEN_KEY } from "./supabase";

const BASE = "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AuthConfig {
  supabase_url: string;
  supabase_anon_key: string;
  allowed_domain: string;
  configured: boolean;
  dev_login: boolean;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (init.body) headers["Content-Type"] = "application/json";
  // Attach the Supabase/Google access token (skip for the public config call).
  if (path !== "/auth/config") {
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}/api${path}`, { ...init, method, headers });

  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const data = await res.json();
      detail = data?.detail || detail;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── auth ──
export const getAuthConfig = () => request<AuthConfig>("/auth/config");
export const getMe = () => request<User>("/auth/me");
// DEV-ONLY: fetch a preview-admin token and store it for subsequent requests.
export async function devLogin(): Promise<void> {
  const r = await request<{ access_token: string }>("/auth/dev-login", { method: "POST" });
  localStorage.setItem(DEV_TOKEN_KEY, r.access_token);
}

// ── floors / systems ──
export const getSystems = (kind?: string) =>
  request<{ systems: SystemSummary[] }>(`/systems${kind ? `?kind=${kind}` : ""}`);
export const getSystem = (slug: string) => request<SystemDetail>(`/systems/${slug}`);
export const createSystem = (b: Record<string, unknown>) =>
  request<{ id: string }>("/systems", { method: "POST", body: JSON.stringify(b) });
export const updateSystem = (id: string, b: Record<string, unknown>) =>
  request<{ ok: boolean }>(`/systems/${id}`, { method: "PATCH", body: JSON.stringify(b) });
export const deleteSystem = (id: string) =>
  request<{ ok: boolean }>(`/systems/${id}`, { method: "DELETE" });
export const reorderSystems = (ids: string[]) =>
  request<{ ok: boolean }>("/systems/reorder", { method: "POST", body: JSON.stringify({ ids }) });

// ── phases ──
export const createPhase = (systemId: string, b: Record<string, unknown>) =>
  request<{ id: string }>(`/systems/${systemId}/phases`, { method: "POST", body: JSON.stringify(b) });
export const updatePhase = (id: string, b: Record<string, unknown>) =>
  request<{ ok: boolean }>(`/phases/${id}`, { method: "PATCH", body: JSON.stringify(b) });
export const deletePhase = (id: string) =>
  request<{ ok: boolean }>(`/phases/${id}`, { method: "DELETE" });
export const reorderPhases = (systemId: string, ids: string[]) =>
  request<{ ok: boolean }>(`/systems/${systemId}/phases/reorder`, { method: "POST", body: JSON.stringify({ ids }) });

// ── items ──
export const createItem = (phaseId: string, b: Record<string, unknown>) =>
  request<{ id: string }>(`/phases/${phaseId}/items`, { method: "POST", body: JSON.stringify(b) });
export const updateItem = (id: string, b: Record<string, unknown>) =>
  request<{ ok: boolean }>(`/items/${id}`, { method: "PATCH", body: JSON.stringify(b) });
export const setItemStatus = (id: string, status: Status) =>
  request<{ ok: boolean }>(`/items/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
// star / unstar a card (priority) so it floats to the top of its board
export const setItemPriority = (id: string, priority: boolean) =>
  request<{ ok: boolean }>(`/items/${id}/priority`, { method: "PATCH", body: JSON.stringify({ priority }) });
export const deleteItem = (id: string) =>
  request<{ ok: boolean }>(`/items/${id}`, { method: "DELETE" });
export const reorderItems = (phaseId: string, ids: string[]) =>
  request<{ ok: boolean }>(`/phases/${phaseId}/items/reorder`, { method: "POST", body: JSON.stringify({ ids }) });
// feature board: create a feature attached to the system directly (no phase)
export const createFeature = (systemId: string, b: Record<string, unknown>) =>
  request<{ id: string }>(`/systems/${systemId}/features`, { method: "POST", body: JSON.stringify(b) });
// feature board: persist the card order after a Kanban drag-reorder
export const reorderFeatures = (systemId: string, ids: string[]) =>
  request<{ ok: boolean }>(`/systems/${systemId}/features/reorder`, { method: "POST", body: JSON.stringify({ ids }) });

// ── versions (per-system iteration timeline) ──
export const createVersion = (systemId: string, b: Record<string, unknown>) =>
  request<{ id: string; version_num: number }>(`/systems/${systemId}/versions`, { method: "POST", body: JSON.stringify(b) });
export const updateVersion = (id: string, b: Record<string, unknown>) =>
  request<{ ok: boolean }>(`/versions/${id}`, { method: "PATCH", body: JSON.stringify(b) });
export const deleteVersion = (id: string) =>
  request<{ ok: boolean }>(`/versions/${id}`, { method: "DELETE" });
export const reorderVersions = (systemId: string, ids: string[]) =>
  request<{ ok: boolean }>(`/systems/${systemId}/versions/reorder`, { method: "POST", body: JSON.stringify({ ids }) });

// ── docs ──
export const getDocs = (systemId: string, kind?: DocKind) =>
  request<{ docs: import("./types").DocIndexEntry[] }>(
    `/systems/${systemId}/docs${kind ? `?kind=${kind}` : ""}`);
export const getDoc = (id: string) => request<DocPage>(`/docs/${id}`);
export const createDoc = (systemId: string, b: Record<string, unknown>) =>
  request<{ id: string }>(`/systems/${systemId}/docs`, { method: "POST", body: JSON.stringify(b) });
export const updateDoc = (id: string, b: Record<string, unknown>) =>
  request<{ ok: boolean }>(`/docs/${id}`, { method: "PATCH", body: JSON.stringify(b) });
export const deleteDoc = (id: string) =>
  request<{ ok: boolean }>(`/docs/${id}`, { method: "DELETE" });

// ── admin users ──
export const getUsers = () => request<{ users: User[] }>("/admin/users");
export const createUser = (b: { email: string; full_name?: string; role: Role }) =>
  request<{ id: string }>("/admin/users", { method: "POST", body: JSON.stringify(b) });
export const updateUser = (id: string, b: Record<string, unknown>) =>
  request<{ ok: boolean }>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(b) });
export const deleteUser = (id: string) =>
  request<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" });
