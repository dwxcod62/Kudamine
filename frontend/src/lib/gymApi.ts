// src/lib/gymApi.ts
import type { MuscleToken } from "../utils/muscles";

/* ========= Types ========= */

export type GymPresetTarget = {
    id: string;
    presetId: string;
    // BE có thể trả token hoặc label — ta sẽ format khi render bằng toLabel()
    detail: string;
};

export type GymPreset = {
    id: string;
    name: string;
    imageUrl?: string;
    instructions: string;
    targets: GymPresetTarget[];
};

export type GymDay = {
    id: string;
    userId: string;
    dateYmd: string; // ISO
    note: string | null;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    focus: { dayId: string; tag: string }[];
    exercises: {
        id: string;
        dayId: string;
        // backend giờ trả presetId + include preset (optional)
        presetId: string;
        // BE include: preset: GymPreset | null
        preset?: GymPreset | null;
        // kept for backward compat if any old rows still had name
        name?: string | null;
        sets: number;
        reps: number;
        weightKg: number;
        note: string | null;
    }[];
};

export type CreatePresetPayload = {
    name: string;
    imageUrl?: string;
    instructions?: string;
    targets?: MuscleToken[]; // ← FE gửi token khớp enum Prisma
};

/* ========= HTTP helper ========= */

const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:3000").replace(/\/+$/, "");
const BASE = `${API_BASE}/gym`;

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

/* ========= API ========= */

// Back-compat: createPreset(userId, name) → giờ bỏ qua userId, chỉ giữ name
function createPresetCompatOrPayload(arg1: CreatePresetPayload | string, nameMaybe?: string) {
    if (typeof arg1 === "string") {
        const name = nameMaybe ?? "Untitled";
        const payload: CreatePresetPayload = { name };
        return http<GymPreset>(`${BASE}/presets`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    } else {
        return http<GymPreset>(`${BASE}/presets`, {
            method: "POST",
            body: JSON.stringify(arg1),
        });
    }
}

export const GymApi = {
    /* ===== Days ===== */

    listDays: (userId: string, fromIso?: string, toIso?: string) =>
        http<GymDay[]>(
            `${BASE}/days?userId=${encodeURIComponent(userId)}${fromIso ? `&from=${encodeURIComponent(fromIso)}` : ""}${
                toIso ? `&to=${encodeURIComponent(toIso)}` : ""
            }`
        ),

    getDay: (id: string) => http<GymDay>(`${BASE}/days/${id}`),

    // Back-compat
    getOrCreateDay: (userId: string, dateYmd: string, note?: string, done?: boolean) =>
        http<GymDay>(`${BASE}/days`, {
            method: "POST",
            body: JSON.stringify({ userId, dateYmd, note, done }),
        }),

    createDay: (payload: { userId: string; dateYmd: string; note?: string; done?: boolean }) =>
        http<GymDay>(`${BASE}/days`, { method: "POST", body: JSON.stringify(payload) }),

    updateDay: (id: string, patch: { note?: string; done?: boolean }) =>
        http<GymDay>(`${BASE}/days/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteDay: (id: string) => http<{ ok: true }>(`${BASE}/days/${id}`, { method: "DELETE" }),

    /* ===== Presets ===== */

    listMusclesDetailed: () => http<string[]>(`${BASE}/muscles/detailed`),

    listPresets: (detail?: MuscleToken) => http<GymPreset[]>(`${BASE}/presets${detail ? `?detail=${encodeURIComponent(detail)}` : ""}`),

    getPreset: (id: string) => http<GymPreset>(`${BASE}/presets/${id}`),

    createPreset: createPresetCompatOrPayload,

    updatePresetMeta: (id: string, patch: { name?: string; imageUrl?: string; instructions?: string }) =>
        http<GymPreset>(`${BASE}/presets/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        }),

    addPresetTargets: (id: string, details: MuscleToken[]) =>
        http<any>(`${BASE}/presets/${id}/targets`, {
            method: "POST",
            body: JSON.stringify({ details }),
        }),

    removePresetTarget: (id: string, detail: MuscleToken) =>
        http<any>(`${BASE}/presets/${id}/targets/${encodeURIComponent(detail)}`, {
            method: "DELETE",
        }),

    deletePreset: (id: string) => http<{ ok: true }>(`${BASE}/presets/${id}`, { method: "DELETE" }),

    /** ============ Focus ============ */

    addFocus: (dayId: string, tags: string[]) =>
        http<{ dayId: string; tag: string }[]>(`${BASE}/days/${dayId}/focus`, {
            method: "POST",
            body: JSON.stringify({ tags }),
        }),

    removeFocus: (dayId: string, tag: string) => http<{ ok: true }>(`${BASE}/days/${dayId}/focus/${encodeURIComponent(tag)}`, { method: "DELETE" }),

    /** ============ Exercises ============ */

    // NOTE: items now accept either presetId OR name (back-compat). Server will resolve name -> presetId.
    addExercises: (dayId: string, items: { presetId?: string; name?: string; sets: number; reps: number; weightKg: number; note?: string }[]) =>
        http<any>(`${BASE}/days/${dayId}/exercises`, {
            method: "POST",
            body: JSON.stringify({ items }),
        }),

    // update can accept presetId or name
    updateExercise: (id: string, patch: { presetId?: string; name?: string; sets?: number; reps?: number; weightKg?: number; note?: string }) =>
        http<any>(`${BASE}/exercises/${id}`, {
            method: "PATCH",
            body: JSON.stringify(patch),
        }),

    deleteExercise: (id: string) => http<{ ok: true }>(`${BASE}/exercises/${id}`, { method: "DELETE" }),
};
