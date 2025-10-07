// src/api/timetableApi.ts
export type TimetableStatus = "Planned" | "InProgress" | "Done" | "Canceled";

/**
 * Các kiểu dữ liệu chung
 */
export interface TimetableTag {
    id: string;
    userId: string;
    name: string;
    color: string;
    createdAt: string;
    updatedAt: string;
}

export interface TimetableEvent {
    id: string;
    userId: string;
    weekStart: string; // ISO date (YYYY-MM-DD)
    day: number; // 0=Mon...6=Sun
    title: string;
    startMin: number;
    duration: number;
    status: TimetableStatus;
    tagId: string | null;
    color: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
    tag?: TimetableTag | null;
}

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

/* ==========================================
   Utility helpers
========================================== */

export function parseDateYmd(s: string): Date {
    const d = new Date(s + "T00:00:00.000Z");
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    return d;
}

export function mondayOfUTC(d: Date): Date {
    const x = new Date(d);
    const dow = x.getUTCDay(); // 0..6 (Sun..Sat)
    const offset = (dow + 6) % 7; // Monday=0
    x.setUTCDate(x.getUTCDate() - offset);
    x.setUTCHours(0, 0, 0, 0);
    return x;
}

export function toYmdUTC(d: Date): string {
    return d.toISOString().slice(0, 10);
}

/* ==========================================
   Core HTTP helper
========================================== */
async function http<T>(path: string, userId: string, init?: RequestInit): Promise<T> {
    const res = await fetch(BASE + path, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId || "demo-user", // fallback cho local dev
            ...(init?.headers || {}),
        },
    });

    if (!res.ok) {
        let msg = res.statusText;
        try {
            const j = await res.json();
            msg = j?.message || msg;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }

    // 204 No Content
    if (res.status === 204) return undefined as any;
    return res.json();
}

/* ==========================================
   TAGS API
========================================== */
export const listTags = (userId: string) => http<TimetableTag[]>("/tt/tags", userId);

export const createTag = (userId: string, p: { name: string; color: string }) =>
    http<TimetableTag>("/tt/tags", userId, {
        method: "POST",
        body: JSON.stringify(p),
    });

export const updateTag = (userId: string, id: string, p: Partial<Pick<TimetableTag, "name" | "color">>) =>
    http<TimetableTag>(`/tt/tags/${id}`, userId, {
        method: "PATCH",
        body: JSON.stringify(p),
    });

export const deleteTag = (userId: string, id: string) =>
    fetch(BASE + `/tt/tags/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
    }).then((r) => {
        if (!r.ok) throw new Error("Delete tag failed");
    });

/* ==========================================
   EVENTS API
========================================== */
export const listEventsForWeek = (userId: string, weekStartYmd: string, includeExpired = false) =>
    http<TimetableEvent[]>(`/tt/events?weekStart=${encodeURIComponent(weekStartYmd)}&includeExpired=${includeExpired}`, userId);

export const createEvent = (
    userId: string,
    p: {
        title: string;
        weekStart: string; // YYYY-MM-DD
        day: number;
        startMin: number;
        duration: number;
        status?: TimetableStatus;
        tagId?: string | null;
        color?: string | null;
        endDate?: string | null;
    }
) =>
    http<TimetableEvent>("/tt/events", userId, {
        method: "POST",
        body: JSON.stringify(p),
    });

export const updateEvent = (
    userId: string,
    id: string,
    p: Partial<{
        title: string;
        weekStart: string;
        day: number;
        startMin: number;
        duration: number;
        status: TimetableStatus;
        tagId: string | null;
        color: string | null;
        endDate: string | null;
    }>
) =>
    http<TimetableEvent>(`/tt/events/${id}`, userId, {
        method: "PATCH",
        body: JSON.stringify(p),
    });

export const deleteEvent = (userId: string, id: string) =>
    fetch(BASE + `/tt/events/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
    }).then((r) => {
        if (!r.ok) throw new Error("Delete event failed");
    });
