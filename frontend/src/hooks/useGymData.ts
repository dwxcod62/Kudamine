// hooks/useGymData.ts
import { useCallback, useRef, useState } from "react";
import type { GymDay, GymPreset } from "../lib/gymApi";
import { GymApi } from "../lib/gymApi";

export type DayLogFE = {
    id: string;
    date: string;
    done: boolean;
    focus: string[];
    exercises: {
        id: string;
        name: string;
        sets: number;
        reps: number;
        weight: number;
        note?: string | null;
    }[];
    note?: string | null;
};

type DaysByDate = Record<string, DayLogFE>;

const toYMD = (s: string) => s.slice(0, 10);
const norm = (s: string) => (s ?? "").trim().toLowerCase();

/** Map cả response nhẹ (range) lẫn response chi tiết (getDay) */
function toFE(d: GymDay): DayLogFE {
    return {
        id: d.id,
        date: toYMD(d.dateYmd),
        done: d.done,
        note: d.note,
        focus: (d.focus ?? []).map((f) => f.tag).filter(Boolean),
        exercises: Array.isArray(d.exercises)
            ? d.exercises.map((e) => ({
                  id: e.id,
                  name: e.name,
                  sets: e.sets,
                  reps: e.reps,
                  weight: e.weightKg, // FE giữ kg
                  note: e.note,
              }))
            : [],
    };
}

export function useGymData(userId: string) {
    const [days, setDays] = useState<DaysByDate>({});
    const [presets, setPresets] = useState<GymPreset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setErr] = useState<string | null>(null);

    /** ========== RANGE NHẸ (không ghi đè exercises bằng rỗng) ========== */
    const loadRange = useCallback(
        async (from: string, to: string) => {
            if (!userId) return;
            setLoading(true);
            setErr(null);
            try {
                const list = await GymApi.listDays(userId, from, to);
                setDays((prev) => {
                    const next = { ...prev };
                    for (const raw of list) {
                        const fe = toFE(raw); // thường exercises = []
                        const ymd = fe.date;
                        const prevDay = prev[ymd];

                        next[ymd] = {
                            // giữ dữ liệu cũ nếu có
                            ...(prevDay ?? {
                                id: "",
                                date: ymd,
                                done: false,
                                focus: [],
                                exercises: [],
                                note: "",
                            }),
                            // ghi đè metadata từ server
                            id: fe.id || prevDay?.id || "",
                            date: ymd,
                            done: fe.done,
                            focus: fe.focus,
                            note: fe.note ?? prevDay?.note ?? "",
                            // CHỐT: chỉ đè exercises nếu server có dữ liệu
                            exercises: (fe.exercises?.length ?? 0) > 0 ? fe.exercises : prevDay?.exercises ?? [],
                        };
                    }
                    return next;
                });
            } catch (e: any) {
                setErr(e?.message ?? "Load days failed");
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    /** ========== GET-OR-CREATE THEO DATE (server upsert) ========== */
    const getOrCreateDay = useCallback(
        async (dateYmd: string) => {
            // nếu cache đã có thì trả luôn
            if (days[dateYmd]?.id) return days[dateYmd];

            const created = await GymApi.getOrCreateDay(userId, dateYmd);
            const fe = toFE(created);
            setDays((prev) => ({
                ...prev,
                [dateYmd]: {
                    ...(prev[dateYmd] ?? {
                        id: "",
                        date: dateYmd,
                        done: false,
                        focus: [],
                        exercises: [],
                        note: "",
                    }),
                    ...fe,
                },
            }));
            return fe;
        },
        [userId, days]
    );

    /** ========== REFRESH CHI TIẾT 1 NGÀY (includes exercises) ========== */
    const inflight = useRef(new Set<string>());
    const refreshOneDay = useCallback(async (dayId: string) => {
        if (!dayId) return;
        if (inflight.current.has(dayId)) return; // tránh gọi trùng
        inflight.current.add(dayId);
        try {
            const d = await GymApi.getDay(dayId); // BE include exercises
            const fe = toFE(d);
            setDays((prev) => ({ ...prev, [fe.date]: { ...(prev[fe.date] ?? ({} as any)), ...fe } }));
            return fe;
        } finally {
            inflight.current.delete(dayId);
        }
    }, []);

    /** ========== DAY CRUD ========== */
    const updateDay = useCallback(async (dayId: string, patch: { note?: string; done?: boolean }) => {
        const updated = await GymApi.updateDay(dayId, patch);
        const fe = toFE(updated);
        setDays((prev) => ({ ...prev, [fe.date]: { ...(prev[fe.date] ?? ({} as any)), ...fe } }));
    }, []);

    const deleteDay = useCallback(async (dayId: string) => {
        await GymApi.deleteDay(dayId);
        setDays((prev) => {
            const next = { ...prev };
            for (const k of Object.keys(next)) {
                if (next[k].id === dayId) delete next[k];
            }
            return next;
        });
    }, []);

    /** ========== FOCUS ========== */
    const addFocus = useCallback(
        async (dayId: string, tags: string[]) => {
            await GymApi.addFocus(dayId, tags.map(norm));
            // Optimistic merge
            setDays((prev) => {
                const next = { ...prev };
                for (const k of Object.keys(next)) {
                    if (next[k].id === dayId) {
                        const uniq = new Set(next[k].focus.concat(tags));
                        next[k] = { ...next[k], focus: Array.from(uniq) };
                    }
                }
                return next;
            });
            // sync lại từ server
            await refreshOneDay(dayId);
        },
        [refreshOneDay]
    );

    const removeFocus = useCallback(
        async (dayId: string, tag: string) => {
            await GymApi.removeFocus(dayId, norm(tag));
            // Optimistic update
            setDays((prev) => {
                const next = { ...prev };
                for (const k of Object.keys(next)) {
                    if (next[k].id === dayId) {
                        next[k] = { ...next[k], focus: next[k].focus.filter((t) => norm(t) !== norm(tag)) };
                    }
                }
                return next;
            });
            // sync lại
            await refreshOneDay(dayId);
        },
        [refreshOneDay]
    );

    /** ========== EXERCISES ========== */
    const addExercises = useCallback(
        async (dayId: string, items: { name: string; sets: number; reps: number; weightKg: number; note?: string }[]) => {
            await GymApi.addExercises(dayId, items);
            await refreshOneDay(dayId);
        },
        [refreshOneDay]
    );

    const updateExercise = useCallback(
        async (exerciseId: string, patch: { name?: string; sets?: number; reps?: number; weightKg?: number; note?: string }) => {
            await GymApi.updateExercise(exerciseId, patch);
            // tìm dayId từ cache rồi refresh lại ngày đó
            const entry = Object.values(days).find((d) => d.exercises.some((e) => e.id === exerciseId));
            if (entry?.id) await refreshOneDay(entry.id);
        },
        [days, refreshOneDay]
    );

    const deleteExercise = useCallback(
        async (exerciseId: string) => {
            await GymApi.deleteExercise(exerciseId);
            // tìm dayId từ cache rồi refresh lại ngày đó
            const entry = Object.values(days).find((d) => d.exercises.some((e) => e.id === exerciseId));
            if (entry?.id) await refreshOneDay(entry.id);
        },
        [days, refreshOneDay]
    );

    /** ========== PRESETS ========== */
    const loadPresets = useCallback(async () => {
        if (!userId) return;
        const list = await GymApi.listPresets();
        setPresets(list);
    }, [userId]);

    const createPreset = useCallback(
        async (name: string) => {
            const p = await GymApi.createPreset(userId, name);
            setPresets((prev) => (prev.some((x) => x.id === p.id) ? prev : prev.concat(p)));
            return p;
        },
        [userId]
    );

    const deletePreset = useCallback(async (id: string) => {
        await GymApi.deletePreset(id);
        setPresets((prev) => prev.filter((x) => x.id !== id));
    }, []);

    return {
        days,
        setDays, // expose nếu page cần merge thủ công
        presets,
        loadPresets,
        createPreset,
        deletePreset,
        loading,
        error,

        loadRange,
        getOrCreateDay,
        refreshOneDay,

        updateDay,
        deleteDay,

        addFocus,
        removeFocus,

        addExercises,
        updateExercise,
        deleteExercise,
    };
}
