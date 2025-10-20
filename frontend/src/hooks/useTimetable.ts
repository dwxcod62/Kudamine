// src/hooks/useTimetable.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    type TimetableTag as ApiTag,
    type TimetableStatus,
    createEvent,
    deleteEvent,
    listEventsForWeek,
    listTags,
    mondayOfUTC,
    toYmdUTC,
    updateEvent,
} from "../lib/ttApi";
import { useAuthStore } from "../stores/auth";

export type TimePresetId = "auto" | "24h" | "day" | "work";

export type UIEvent = {
    id: string;
    title: string;
    day: number;
    startMin: number;
    duration: number;
    status: TimetableStatus;
    color: string;
    tagId: string | null;
    tagName: string;
    endDate: string | null;
    isExpired?: boolean;
};

const todayUtcYmd = () => {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0);
    return t.toISOString().slice(0, 10);
};

export const COLOR_CHOICES = [
    "bg-indigo-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-blue-500",
    "bg-fuchsia-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-lime-500",
    "bg-orange-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-sky-500",
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
] as const;

// Tùy bạn cần map hex => tailwind class; tạm fallback 1 màu an toàn
function hexToTailwindBg(_hex: string): string {
    return "bg-emerald-500";
}

export function useTimetable() {
    const user = useAuthStore((s) => s.user);
    const userId = user?.id ?? "demo-user";

    console.log(userId);

    // time window
    const STEP = 30;
    const CELL_PX = 36; // mobile cell height
    const [timePreset, setTimePreset] = useState<TimePresetId>("auto");

    // tuần hiện tại (UTC Monday)
    const [weekStart, setWeekStart] = useState<string>(() => {
        const now = new Date();
        const mon = mondayOfUTC(now);
        return toYmdUTC(mon);
    });

    // data
    const [tags, setTags] = useState<ApiTag[]>([]);
    const [events, setEvents] = useState<UIEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    type TagFilter = { id: string; name: string } | "All";
    const [tagFilter, setTagFilter] = useState<TagFilter>("All");
    const [search, setSearch] = useState("");

    // cho phép hiển thị cả event đã hết hạn
    const [includeExpired, setIncludeExpired] = useState(false);

    // ===== Helpers mapping & reload =====
    const mapApiEvent = useCallback((e: any): UIEvent => {
        const endYmd = e.endDate ? String(e.endDate).slice(0, 10) : null;
        const expired = !!(endYmd && endYmd <= todayUtcYmd());
        return {
            id: e.id,
            title: e.title,
            day: e.day,
            startMin: e.startMin,
            duration: e.duration,
            status: e.status,
            color: e.color ?? (e.tag?.color ? hexToTailwindBg(e.tag.color) : "bg-emerald-500"),
            tagId: e.tagId ?? null,
            tagName: e.tag?.name ?? "Personal",
            endDate: endYmd,
            isExpired: expired,
        };
    }, []);

    const reloadWeek = useCallback(async () => {
        const api = await listEventsForWeek(userId, weekStart, includeExpired);
        setEvents(api.map(mapApiEvent));
    }, [includeExpired, mapApiEvent, userId, weekStart]);

    // ===== Load data =====
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const tagsLoaded = await listTags(userId);
                if (cancelled) return;
                setTags(tagsLoaded);

                const apiEvents = await listEventsForWeek(userId, weekStart, includeExpired);
                if (cancelled) return;
                setEvents(apiEvents.map(mapApiEvent));
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Failed to load timetable");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, weekStart, includeExpired, mapApiEvent]);

    // tag options (UI)
    const tagOptions = useMemo(() => [{ id: "", name: "All" }, ...tags.map((t) => ({ id: t.id, name: t.name }))], [tags]);

    // filter
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return events.filter((e) => (tagFilter === "All" || e.tagId === (tagFilter as any).id) && (!q || e.title.toLowerCase().includes(q)));
    }, [events, tagFilter, search]);

    // time window
    const FULL_DAY = 24 * 60;
    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
    const { GRID_START, GRID_END } = useMemo(() => {
        if (timePreset === "24h") return { GRID_START: 0, GRID_END: FULL_DAY };
        if (timePreset === "day") return { GRID_START: 6 * 60, GRID_END: 22 * 60 };
        if (timePreset === "work") return { GRID_START: 8 * 60, GRID_END: 18 * 60 };

        const pool = tagFilter === "All" ? events : events.filter((e) => e.tagId === (tagFilter as any).id);
        if (!pool.length) return { GRID_START: 6 * 60, GRID_END: 22 * 60 };

        const minStart = Math.min(...pool.map((e) => e.startMin));
        const maxEnd = Math.max(...pool.map((e) => e.startMin + e.duration));
        const padMin = 60;
        const start = clamp(Math.floor((minStart - padMin) / STEP) * STEP, 0, 24 * 60 - STEP);
        const end = clamp(Math.ceil((maxEnd + padMin) / STEP) * STEP, start + STEP, 24 * 60);
        return { GRID_START: start, GRID_END: end };
    }, [events, tagFilter, timePreset]);

    // hours for grid
    const hours = useMemo(() => {
        const arr: number[] = [];
        for (let m = GRID_START; m <= GRID_END; m += STEP) arr.push(m);
        return arr;
    }, [GRID_START, GRID_END]);

    // helpers
    const pad = (n: number) => String(n).padStart(2, "0");
    const minToLabel = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

    // ===== CRUD =====
    const addQuick = useCallback(
        async (day: number) => {
            const base = GRID_START + 60 * (Math.random() * 2);
            const startMin = Math.round(base / STEP) * STEP;
            const color = COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)];

            try {
                const created = await createEvent(userId, {
                    title: "New Block",
                    weekStart,
                    day,
                    startMin,
                    duration: 60,
                    status: "Planned",
                    tagId: null,
                    color,
                    // endDate: undefined -> backend sẽ default +7 ngày từ weekStart
                });
                setEvents((prev) => [...prev, mapApiEvent(created)]);
            } catch (e: any) {
                alert("Create failed: " + e.message);
            }
        },
        [GRID_START, STEP, weekStart, userId, mapApiEvent]
    );

    const updateLocal = useCallback((id: string, patch: Partial<UIEvent>) => {
        setEvents((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    }, []);

    const moveEvent = useCallback(
        async (id: string, day: number, startMin: number) => {
            const ev = events.find((e) => e.id === id);
            if (!ev) return;
            const snapped = Math.round(startMin / STEP) * STEP;
            const safeMin = clamp(snapped, 0, 24 * 60 - ev.duration);

            // optimistic
            updateLocal(id, { day, startMin: safeMin });

            try {
                await updateEvent(userId, id, { day, startMin: safeMin });
            } catch {
                await reloadWeek();
                alert("Update failed.");
            }
        },
        [events, STEP, updateLocal, userId, reloadWeek]
    );

    const changeDuration = useCallback(
        async (id: string, newDuration: number) => {
            // optimistic
            updateLocal(id, { duration: newDuration });
            try {
                await updateEvent(userId, id, { duration: newDuration });
            } catch {
                await reloadWeek();
                alert("Resize failed.");
            }
        },
        [updateLocal, userId, reloadWeek]
    );

    // Cho phép edit endDate (expired day)
    const updateFields = useCallback(
        async (id: string, p: { title?: string; color?: string; tagId?: string | null; endDate?: string | null }) => {
            const optimistic: Partial<UIEvent> = {
                title: p.title,
                color: p.color,
                tagId: p.tagId,
                tagName: p.tagId ? tags.find((t) => t.id === p.tagId)?.name ?? "—" : "Personal",
                ...(p.endDate !== undefined ? { endDate: p.endDate } : {}),
            };
            if (p.endDate !== undefined) {
                optimistic.endDate = p.endDate;
                optimistic.isExpired = !!(p.endDate && p.endDate <= todayUtcYmd());
            }

            updateLocal(id, optimistic);

            try {
                await updateEvent(userId, id, {
                    title: p.title,
                    color: p.color,
                    tagId: p.tagId,
                    endDate: p.endDate ?? null, // cho phép xóa hạn
                });
            } catch (e: any) {
                alert("Save failed: " + e.message);
                await reloadWeek();
            }
        },
        [tags, updateLocal, userId, reloadWeek]
    );

    const deleteById = useCallback(
        async (id: string) => {
            const keep = events;
            // optimistic
            setEvents((p) => p.filter((x) => x.id !== id));
            try {
                await deleteEvent(userId, id);
            } catch {
                setEvents(keep);
                alert("Delete failed");
            }
        },
        [events, userId]
    );

    // group by day
    const byDay = useMemo(() => {
        const map: Record<number, UIEvent[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        for (const e of filtered) map[e.day].push(e);
        Object.values(map).forEach((a) => a.sort((x, y) => x.startMin - y.startMin));
        return map;
    }, [filtered]);

    // week shifts
    const shiftWeek = useCallback(
        (deltaDays: number) => {
            // deltaDays = -7 / +7, hoặc 0 nếu muốn nhảy về tuần hiện tại (bạn có thể custom)
            const d = new Date(weekStart + "T00:00:00.000Z");
            d.setUTCDate(d.getUTCDate() + deltaDays);
            const monday = mondayOfUTC(d);
            setWeekStart(toYmdUTC(monday));
        },
        [weekStart]
    );

    return {
        // state
        STEP,
        CELL_PX,
        weekStart,
        setWeekStart,
        shiftWeek,
        timePreset,
        setTimePreset,
        tags,
        tagOptions,
        tagFilter,
        setTagFilter,
        search,
        setSearch,
        events,
        filtered,
        byDay,
        hours,
        GRID_START,
        GRID_END,
        loading,
        error,

        // expired filter
        includeExpired,
        setIncludeExpired,

        // helpers
        minToLabel,
        clamp,

        // actions
        addQuick,
        moveEvent,
        changeDuration,
        updateFields,
        deleteById,
    };
}
