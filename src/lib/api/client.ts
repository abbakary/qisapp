const TOKEN_KEY = "qisas.token";
export const AUTH_LOST_EVENT = "qisas:auth-lost";
const PRODUCTION_API = "https://qisasss-production.up.railway.app";

export function apiBase(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "";
  } else if (import.meta.env.DEV) {
    return "";
  }
  return PRODUCTION_API;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function apiUrl(path: string): string {
  const base = apiBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const base = apiBase();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(apiUrl(path), { ...init, headers });
  // Only drop a real session when the server rejected a token we sent.
  // Guest 401s (admin polls, progress) must not wipe a token set mid-flight.
  if (res.status === 401 && token) {
    setToken(null);
    try {
      window.dispatchEvent(new Event(AUTH_LOST_EVENT));
    } catch {
      /* ignore */
    }
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || data.message || detail;
      if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg || d).join("; ");
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, String(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function uploadForm<T = any>(
  path: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl(path));
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      const status = xhr.status;
      if (status === 401 && token) {
        setToken(null);
        try {
          window.dispatchEvent(new Event(AUTH_LOST_EVENT));
        } catch {
          /* ignore */
        }
      }
      if (status < 200 || status >= 300) {
        let detail = xhr.statusText || "Upload failed";
        try {
          const data = JSON.parse(xhr.responseText);
          detail = data.detail || data.message || detail;
          if (Array.isArray(detail)) detail = detail.map((d: any) => d.msg || d).join("; ");
        } catch {
          /* ignore */
        }
        reject(new ApiError(status, String(detail)));
        return;
      }
      onProgress?.(100);
      if (status === 204 || !xhr.responseText) {
        resolve(undefined as T);
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText) as T);
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Upload failed. Check your connection."));
    xhr.send(form);
  });
}
