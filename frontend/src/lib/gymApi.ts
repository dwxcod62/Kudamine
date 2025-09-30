// src/lib/gymApi.ts

export type GymDay = {
    id: string;
    userId: string;
    dateYmd: string; // ISO date (server stringify)
    note: string | null;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    focus: { dayId: string; tag: string }[];
    exercises: {
        id: string;
        dayId: string;
        name: string;
        sets: number;
        reps: number;
        weightKg: number;
        note: string | null;
    }[];
};

export type GymPreset = { id: string; userId: string; name: string };

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:3000").replace(/\/+$/, "");
const BASE = `${API_BASE}/gym`;

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        headers: { "Content-Type": "application/json" },
        // Nếu bạn dùng session cookie, mở dòng sau:
        // credentials: "include",
        ...init,
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json();
}

export const GymApi = {
    /** ============ Days ============ */

    /**
     * Range "nhẹ": backend trả metadata (done, note, focus, có thể kèm _count.exercises),
     * KHÔNG nhất thiết trả mảng exercises để load lịch nhanh.
     */
    listDays: (userId: string, fromIso?: string, toIso?: string) =>
        http<GymDay[]>(
            `${BASE}/days?userId=${encodeURIComponent(userId)}${fromIso ? `&from=${encodeURIComponent(fromIso)}` : ""}${
                toIso ? `&to=${encodeURIComponent(toIso)}` : ""
            }`
        ),

    /** Chi tiết 1 ngày: luôn include exercises trên backend */
    getDay: (id: string) => http<GymDay>(`${BASE}/days/${id}`),

    /**
     * Get-or-create theo date (backend dùng upsert).
     * Dùng tên getOrCreateDay để rõ nghĩa, vẫn trỏ vào POST /days.
     */
    getOrCreateDay: (userId: string, dateYmd: string, note?: string, done?: boolean) =>
        http<GymDay>(`${BASE}/days`, { method: "POST", body: JSON.stringify({ userId, dateYmd, note, done }) }),

    /** Nếu vẫn muốn gọi trực tiếp create theo tên cũ, giữ alias */
    createDay: (payload: { userId: string; dateYmd: string; note?: string; done?: boolean }) =>
        http<GymDay>(`${BASE}/days`, { method: "POST", body: JSON.stringify(payload) }),

    updateDay: (id: string, patch: { note?: string; done?: boolean }) =>
        http<GymDay>(`${BASE}/days/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteDay: (id: string) => http<{ ok: true }>(`${BASE}/days/${id}`, { method: "DELETE" }),

    /** ============ Focus ============ */

    addFocus: (dayId: string, tags: string[]) =>
        http<{ dayId: string; tag: string }[]>(`${BASE}/days/${dayId}/focus`, {
            method: "POST",
            body: JSON.stringify({ tags }),
        }),

    removeFocus: (dayId: string, tag: string) => http<{ ok: true }>(`${BASE}/days/${dayId}/focus/${encodeURIComponent(tag)}`, { method: "DELETE" }),

    /** ============ Exercises ============ */

    addExercises: (dayId: string, items: { name: string; sets: number; reps: number; weightKg: number; note?: string }[]) =>
        http<any>(`${BASE}/days/${dayId}/exercises`, {
            method: "POST",
            body: JSON.stringify({ items }),
        }),

    updateExercise: (id: string, patch: { name?: string; sets?: number; reps?: number; weightKg?: number; note?: string }) =>
        http<any>(`${BASE}/exercises/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        }),

    deleteExercise: (id: string) => http<{ ok: true }>(`${BASE}/exercises/${id}`, { method: "DELETE" }),

    /** ============ Presets ============ */

    listPresets: (userId: string) => http<GymPreset[]>(`${BASE}/presets?userId=${encodeURIComponent(userId)}`),

    createPreset: (userId: string, name: string) =>
        http<GymPreset>(`${BASE}/presets`, {
            method: "POST",
            body: JSON.stringify({ userId, name }),
        }),

    deletePreset: (id: string) => http<{ ok: true }>(`${BASE}/presets/${id}`, { method: "DELETE" }),
};
