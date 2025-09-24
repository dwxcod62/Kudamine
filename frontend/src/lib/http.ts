// tiny fetch wrapper + baseURL
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(API_BASE + path, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return (await r.json()) as T;
}
export const get = <T>(p: string) => http<T>(p);
export const post = <T>(p: string, body?: any) => http<T>(p, { method: "POST", body: JSON.stringify(body) });
export const patch = <T>(p: string, body?: any) => http<T>(p, { method: "PATCH", body: JSON.stringify(body) });
export const del = <T>(p: string) => http<T>(p, { method: "DELETE" });
