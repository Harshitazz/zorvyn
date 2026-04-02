import type {
  DashboardData,
  Pagination,
  RecordItem,
  TrendPoint,
  TrendWeek,
  User,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

function parseMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed";
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string" && b.message) return b.message;
  const d = b.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String((item as { msg: string }).msg)
          : JSON.stringify(item)
      )
      .join("; ");
  }
  return "Request failed";
}

async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string
): Promise<ApiSuccess<T>> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(parseMessage(body), res.status, body);
  }

  return body as ApiSuccess<T>;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: string; email: string; role: string } }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    me: (token: string) =>
      request<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
      }>("/api/auth/me", undefined, token),
  },
  records: {
    list: (
      token: string,
      p: {
        page?: number;
        limit?: number;
        type?: string;
        category?: string;
        startDate?: string;
        endDate?: string;
      }
    ) =>
      request<{ items: RecordItem[]; pagination: Pagination }>(
        `/api/records${qs(p)}`,
        undefined,
        token
      ),
    get: (token: string, id: string) =>
      request<RecordItem>(`/api/records/${id}`, undefined, token),
    create: (token: string, body: Record<string, unknown>) =>
      request<{ id: string }>("/api/records", { method: "POST", body: JSON.stringify(body) }, token),
    update: (token: string, id: string, body: Record<string, unknown>) =>
      request<{ id: string }>(
        `/api/records/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        token
      ),
    remove: (token: string, id: string) =>
      request<{ id: string }>(`/api/records/${id}`, { method: "DELETE" }, token),
  },
  dashboard: {
    summary: (token: string, startDate?: string, endDate?: string) =>
      request<DashboardData>(
        `/api/dashboard${qs({ startDate, endDate })}`,
        undefined,
        token
      ),
    monthlyTrends: (token: string, year?: number) =>
      request<TrendPoint[]>(
        `/api/dashboard/trends/monthly${qs({ year: year ?? undefined })}`,
        undefined,
        token
      ),
    weeklyTrends: (token: string) =>
      request<TrendWeek[]>(`/api/dashboard/trends/weekly`, undefined, token),
  },
  users: {
    list: (
      token: string,
      p: { page?: number; limit?: number; role?: string; status?: string }
    ) =>
      request<{ items: User[]; pagination: Pagination }>(
        `/api/users${qs(p)}`,
        undefined,
        token
      ),
    get: (token: string, id: string) =>
      request<User>(`/api/users/${id}`, undefined, token),
    create: (token: string, body: { name: string; email: string; password: string; role: string }) =>
      request<{ id: string }>("/api/users", { method: "POST", body: JSON.stringify(body) }, token),
    update: (token: string, id: string, body: Record<string, unknown>) =>
      request<{ id: string }>(
        `/api/users/${id}`,
        { method: "PATCH", body: JSON.stringify(body) },
        token
      ),
    remove: (token: string, id: string) =>
      request<{ id: string }>(`/api/users/${id}`, { method: "DELETE" }, token),
  },
};

export { API_BASE_URL };
