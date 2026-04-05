import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4700";

// Setear cookie HttpOnly después del login
let _cookieSet = false;
async function ensureCookie() {
  if (_cookieSet) return;
  try {
    await fetch("/api/auth/set-token", { method: "POST", credentials: "include" });
    _cookieSet = true;
  } catch { /* ignore */ }
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getSession() as Record<string, unknown> | null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // JWT viaja en cookie HttpOnly zentto_token — NO Bearer.
  // Asegurar que la cookie está seteada.
  if (session) await ensureCookie();

  // Company/branch context desde localStorage
  try {
    const stored = localStorage.getItem("zentto-active-company");
    if (stored) {
      const company = JSON.parse(stored);
      if (company.companyId) headers["x-company-id"] = String(company.companyId);
      if (company.branchId) headers["x-branch-id"] = String(company.branchId);
      if (company.timeZone) headers["x-timezone"] = company.timeZone;
      if (company.countryCode) headers["x-country-code"] = company.countryCode;
    }
  } catch { /* SSR or no localStorage */ }

  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    _cookieSet = false; // Resetear para re-intentar set-token
    if (typeof window !== "undefined") {
      // Limpiar cookie antes de redirigir
      await fetch("/api/auth/set-token", { method: "DELETE", credentials: "include" }).catch(() => {});
      window.location.href = "/tickets/login";
    }
    throw new Error("session_expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
