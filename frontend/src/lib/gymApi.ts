export type GymDay = {
    id: string;
    userId: string;
    dateYmd: string; // ISO date (server trả về Date -> stringify/adapter)
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

const BASE = "/gym"; // ví dụ bạn mount router tại app.use("/gym", r)

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json();
}

export const GymApi = {
    // Days
    listDays: (userId: string, from?: string, to?: string) =>
        http<GymDay[]>(`${BASE}/days?userId=${encodeURIComponent(userId)}${from ? `&from=${from}` : ""}${to ? `&to=${to}` : ""}`),

    getDay: (id: string) => http<GymDay>(`${BASE}/days/${id}`),

    createDay: (payload: { userId: string; dateYmd: string; note?: string; done?: boolean }) =>
        http<GymDay>(`${BASE}/days`, { method: "POST", body: JSON.stringify(payload) }),

    updateDay: (id: string, patch: { note?: string; done?: boolean }) =>
        http<GymDay>(`${BASE}/days/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteDay: (id: string) => http<{ ok: true }>(`${BASE}/days/${id}`, { method: "DELETE" }),

    // Focus
    addFocus: (dayId: string, tags: string[]) =>
        http<{ dayId: string; tag: string }[]>(`${BASE}/days/${dayId}/focus`, { method: "POST", body: JSON.stringify({ tags }) }),

    removeFocus: (dayId: string, tag: string) => http<{ ok: true }>(`${BASE}/days/${dayId}/focus/${encodeURIComponent(tag)}`, { method: "DELETE" }),

    // Exercises
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

    // Presets
    listPresets: (userId: string) => http<GymPreset[]>(`${BASE}/presets?userId=${encodeURIComponent(userId)}`),

    createPreset: (userId: string, name: string) =>
        http<GymPreset>(`${BASE}/presets`, {
            method: "POST",
            body: JSON.stringify({ userId, name }),
        }),

    deletePreset: (id: string) => http<{ ok: true }>(`${BASE}/presets/${id}`, { method: "DELETE" }),
};
