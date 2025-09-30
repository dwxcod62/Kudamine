// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_BASE;

export async function postJSON<T>(path: string, body: Record<string, any>, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
        body: JSON.stringify(body),
        credentials: "include",
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data as T;
}
