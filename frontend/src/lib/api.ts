import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4700";

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getSession() as { accessToken?: string } | null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  // Company/branch from localStorage
  try {
    const stored = localStorage.getItem("zentto-active-company");
    if (stored) {
      const company = JSON.parse(stored);
      if (company.companyId) headers["x-company-id"] = String(company.companyId);
      if (company.branchId) headers["x-branch-id"] = String(company.branchId);
      if (company.timeZone) headers["x-timezone"] = company.timeZone;
      if (company.countryCode) headers["x-country-code"] = company.countryCode;
    }
  } catch { /* ignore */ }

  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Auto-signout if token expired
    window.location.href = "/api/auth/signout";
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
