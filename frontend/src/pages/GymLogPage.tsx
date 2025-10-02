// src/pages/GymLogPage.tsx
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Dumbbell, Plus, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DayLogFE } from "../hooks/useGymData";
import { useGymData } from "../hooks/useGymData";
import { useAuthStore } from "../stores/auth";

// Components
import { DesktopExerciseRow, type Exercise } from "../components/gym/DesktopExerciseRow";
import { InlineAddPreset } from "../components/gym/InlineAddPreset";
import { MobileExerciseCard } from "../components/gym/MobileExerciseCard";
import { MonthCalendar } from "../components/gym/MonthCalendar";
import { Stepper } from "../components/gym/Stepper";
import { WeekScroller } from "../components/gym/WeekScroller";

// Utils
import { useLocalStorage } from "../hooks/useLocalStorage";
import { addDays, addMonths, parseISO, startOfMonth, startOfWeek, ymdLocal } from "../utils/date";
import { refreshOneDay } from "../utils/gymMap";
import { norm } from "../utils/strings";
import { kgToLb, lbToKg, type Unit } from "../utils/units";

/* =================== Types =================== */
type DaysDB = Record<string, DayLogFE>;

/* =================== Constants =================== */
const KEY_UNIT = "gym-unit.v1";
const MUSCLE_PRESETS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Push", "Pull", "Full Body"];

export default function GymLogPage() {
    const user = useAuthStore((s) => s.user);
    const userId = user?.id ?? "";

    const {
        days,
        setDays,
        presets,
        loadPresets,
        createPreset,
        loading,
        loadRange,
        getOrCreateDay,
        updateDay,
        addFocus,
        removeFocus,
        addExercises,
        updateExercise,
        deleteExercise,
    } = useGymData(userId);

    const [unit, setUnit] = useLocalStorage<Unit>(KEY_UNIT, "kg");
    const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [weekAnchor, setWeekAnchor] = useState<Date>(() => startOfWeek(new Date()));
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const selKey = ymdLocal(selectedDate);
    const today = new Date();

    // Load current month range
    useEffect(() => {
        if (!userId) return;
        const first = startOfMonth(viewMonth);
        const endExclusive = addMonths(first, 1);
        loadRange(ymdLocal(first), ymdLocal(endExclusive));
    }, [userId, viewMonth, loadRange]);

    // Load presets once
    useEffect(() => {
        if (!userId) return;
        loadPresets();
    }, [userId, loadPresets]);

    const dayLog: DayLogFE = useMemo(
        () =>
            days[selKey] ?? {
                id: "",
                date: selKey,
                done: false,
                focus: [],
                exercises: [],
                note: "",
            },
        [days, selKey]
    );

    async function ensureDayId(): Promise<string> {
        if (dayLog.id) return dayLog.id;
        const created = await getOrCreateDay(selKey);
        return created.id;
    }

    const getLastWeightKg = (name: string) => {
        const keys = Object.keys(days).sort((a, b) => (a < b ? 1 : -1));
        for (const k of keys) {
            const ex = days[k]?.exercises?.find((e) => e.name.toLowerCase() === name.toLowerCase());
            if (ex) return ex.weight;
        }
        return undefined;
    };

    useEffect(() => {
        setWeekAnchor(startOfWeek(selectedDate));
    }, [selectedDate]);

    const shiftWeek = (deltaDays: number) => {
        const start = startOfWeek(weekAnchor);
        const newStart = addDays(start, deltaDays);
        const offset = selectedDate.getDay();
        const newSelected = addDays(newStart, offset);
        setSelectedDate(newSelected);
    };

    // Add exercise form state
    const [form, setForm] = useState<Partial<Exercise>>({
        name: "",
        sets: 3,
        reps: 10,
        weight: 20,
        note: "",
    });
    const nameRef = useRef<HTMLInputElement>(null);

    const applyPresetName = (name: string) => {
        const lastKg = getLastWeightKg(name);
        const baseKg = lastKg ?? 20;
        const shown = unit === "kg" ? baseKg : kgToLb(baseKg);
        setForm({
            name,
            sets: 3,
            reps: 10,
            weight: Number(shown.toFixed(1)),
            note: "",
        });
        nameRef.current?.focus();
    };

    const addExerciseFE = async () => {
        const nm = form.name?.trim();
        if (!nm) {
            nameRef.current?.focus();
            return;
        }
        const baseKg = unit === "kg" ? Number(form.weight ?? 0) : lbToKg(Number(form.weight ?? 0));
        const dayId = await ensureDayId();
        await addExercises(dayId, [
            {
                name: nm,
                sets: Number(form.sets ?? 3),
                reps: Number(form.reps ?? 10),
                weightKg: Number(isNaN(baseKg) ? 0 : Math.max(0, baseKg)),
                note: form.note?.trim() || "",
            },
        ]);
        await refreshOneDay(dayId, setDays);
        nameRef.current?.focus();
    };

    const editExerciseFE = async (exerciseId: string, patch: Partial<Exercise>) => {
        const payload: any = {};
        if (patch.name !== undefined) payload.name = patch.name;
        if (patch.sets !== undefined) payload.sets = patch.sets;
        if (patch.reps !== undefined) payload.reps = patch.reps;
        if (patch.weight !== undefined) payload.weightKg = patch.weight; // FE giữ kg
        if (patch.note !== undefined) payload.note = patch.note;
        await updateExercise(exerciseId, payload);
        const dayId = await ensureDayId();
        await refreshOneDay(dayId, setDays);
    };

    const removeExerciseFE = async (exerciseId: string) => {
        await deleteExercise(exerciseId);
        const dayId = await ensureDayId();
        await refreshOneDay(dayId, setDays);
    };

    async function ensureDayIdSynced(): Promise<string> {
        const id = dayLog.id ? dayLog.id : (await getOrCreateDay(selKey)).id;
        await refreshOneDay(id, setDays);
        return id;
    }

    const toggleFocusFE = async (tagLabel: string) => {
        const dayId = await ensureDayIdSynced();

        const api = await (await import("../lib/gymApi")).GymApi.getDay(dayId);
        const current: string[] = (api.focus ?? []).map((f: any) => (typeof f === "string" ? norm(f) : norm(f?.tag)));

        const want = norm(tagLabel);
        const has = current.includes(want);

        const ymd = selKey;
        setDays((prev) => {
            const base = prev[ymd] ?? dayLog;
            const nextFocus = has ? base.focus.filter((t) => norm(t) !== want) : [...base.focus, tagLabel];
            return { ...prev, [ymd]: { ...base, focus: nextFocus } };
        });

        if (has) await removeFocus(dayId, want);
        else await addFocus(dayId, [want]);

        refreshOneDay(dayId, setDays);
    };

    const toggleDoneFE = async () => {
        const dayId = await ensureDayId();
        await updateDay(dayId, { done: !dayLog.done });
        await refreshOneDay(dayId, setDays);
    };

    const monthLabel = useMemo(() => viewMonth.toLocaleString("en-US", { month: "long", year: "numeric" }), [viewMonth]);

    const monthMap = useMemo(() => {
        const map = new Map<string, DayLogFE>();
        for (const [rawK, v] of Object.entries(days)) {
            const k = rawK.length > 10 ? rawK.slice(0, 10) : rawK;
            const d = parseISO(k);
            if (d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()) {
                map.set(k, v);
            }
        }
        return map;
    }, [days, viewMonth]);

    const showWeight = (kg: number) => (unit === "kg" ? kg : kgToLb(kg));
    const fromInputWeightToKg = (val: number) => (unit === "kg" ? val : lbToKg(val));

    if (!userId) {
        return <div className="p-6 text-center text-slate-600 dark:text-slate-300">You need to log in to use Gym Log.</div>;
    }

    // Ensure day details hydrated when switching dates
    useEffect(() => {
        (async () => {
            if (!dayLog?.id) return;
            if ((dayLog.exercises?.length ?? 0) === 0) {
                await refreshOneDay(dayLog.id, setDays);
            }
        })();
    }, [selKey, dayLog.id]);

    return (
        <div className="h-full w-full p-4 sm:p-6 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-4 sm:mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500 text-white shrink-0">
                        <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                        <h2 className="text-xl sm:text-2xl font-semibold truncate">Gym Log</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Theo dõi bài tập & mức tạ • mobile-first</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Unit */}
                    <div className="hidden sm:flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm dark:border-slate-700">
                        <SettingsIcon className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-500">Unit</span>
                        <button
                            onClick={() => setUnit("kg")}
                            className={`px-2 py-0.5 rounded ${
                                unit === "kg" ? "bg-emerald-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            kg
                        </button>
                        <button
                            onClick={() => setUnit("lb")}
                            className={`px-2 py-0.5 rounded ${
                                unit === "lb" ? "bg-emerald-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            lb
                        </button>
                    </div>

                    {/* Month nav (desktop) */}
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => setViewMonth((m) => addMonths(m, -1))}
                            className="rounded-lg border px-2 py-2 text-sm dark:border-slate-700"
                            title="Prev"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-500" />
                            <span>{monthLabel}</span>
                        </div>
                        <button
                            onClick={() => setViewMonth((m) => addMonths(m, 1))}
                            className="rounded-lg border px-2 py-2 text-sm dark:border-slate-700"
                            title="Next"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[360px,minmax(0,1fr)] gap-4 sm:gap-6">
                {/* Month calendar (>= lg) */}
                <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow">
                    <MonthCalendar viewMonth={viewMonth} selectedDate={selectedDate} onSelect={setSelectedDate} monthMap={monthMap} today={today} />
                </div>

                {/* Week scroller (mobile) */}
                <div className="lg:hidden">
                    <WeekScroller
                        anchorDate={weekAnchor}
                        selectedDate={selectedDate}
                        onSelect={(d) => setSelectedDate(d)}
                        today={today}
                        monthMap={days as DaysDB}
                        onShift={shiftWeek}
                    />
                </div>

                {/* Right: day details */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Day + Done + Focus + Unit (mobile unit switch) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Selected</div>
                                <div className="text-lg sm:text-xl font-bold">
                                    {selectedDate.toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="sm:hidden rounded-lg border px-2.5 py-1.5 text-xs dark:border-slate-700">
                                    <span className="text-slate-500 mr-1">Unit</span>
                                    <button
                                        onClick={() => setUnit(unit === "kg" ? "lb" : "kg")}
                                        className="px-2 py-0.5 rounded bg-emerald-500 text-white"
                                    >
                                        {unit}
                                    </button>
                                </div>
                                <button
                                    onClick={toggleDoneFE}
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                                        dayLog.done
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                                    }`}
                                    disabled={loading}
                                >
                                    <Check className="h-4 w-4" />
                                    {dayLog.done ? "Đã tập" : "Đánh dấu đã tập"}
                                </button>
                            </div>
                        </div>

                        {/* Focus chips */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {MUSCLE_PRESETS.map((m) => {
                                const active = dayLog.focus.some((t) => norm(t) === norm(m));
                                return (
                                    <button
                                        key={m}
                                        onClick={() => toggleFocusFE(m)}
                                        className={`chip transition ${active ? "bg-emerald-500 !text-white" : ""}`}
                                        style={{ padding: ".35rem .65rem" }}
                                        disabled={loading}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Presets */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus className="h-4 w-4 text-emerald-500" />
                            <div className="font-semibold">Presets</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((p) => (
                                <button key={p.id} onClick={() => applyPresetName(p.name)} className="chip hover:opacity-90">
                                    {p.name}
                                </button>
                            ))}
                            <InlineAddPreset
                                onAdd={async (name) => {
                                    const nm = name.trim();
                                    if (!nm) return;
                                    await createPreset(nm);
                                    applyPresetName(nm);
                                }}
                            />
                        </div>
                    </div>

                    {/* Add exercise form */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr,110px,110px,140px] gap-3">
                            <input
                                ref={nameRef}
                                value={form.name ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Exercise (e.g., Bench Press)"
                                className="rounded-lg border px-3 py-2 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                            />
                            <Stepper label="Sets" value={form.sets ?? 3} onChange={(v) => setForm((f) => ({ ...f, sets: v }))} />
                            <Stepper label="Reps" value={form.reps ?? 10} onChange={(v) => setForm((f) => ({ ...f, reps: v }))} />
                            <Stepper
                                label={`Weight (${unit})`}
                                value={Number(form.weight ?? 20)}
                                onChange={(v) => setForm((f) => ({ ...f, weight: v }))}
                                step={unit === "kg" ? 2.5 : 5}
                            />
                        </div>
                        <div className="mt-3 flex gap-2">
                            <input
                                value={form.note ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                                placeholder="Note (optional)"
                                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                            />
                            <button onClick={addExerciseFE} className="btn inline-flex items-center gap-2" disabled={loading}>
                                <Dumbbell className="h-4 w-4" />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Exercise table / list */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow overflow-hidden">
                        <table className="table w-full hidden sm:table">
                            <thead>
                                <tr>
                                    <th>Exercise</th>
                                    <th>Focus</th>
                                    <th>Sets</th>
                                    <th>Reps</th>
                                    <th>Weight ({unit})</th>
                                    <th>Note</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayLog.exercises.length === 0 ? (
                                    <tr>
                                        <td className="py-8 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                                            No exercises yet
                                        </td>
                                    </tr>
                                ) : (
                                    dayLog.exercises.map((ex) => (
                                        <DesktopExerciseRow
                                            key={ex.id}
                                            ex={{ ...ex, weight: showWeight(ex.weight) }}
                                            onEdit={async (patch) => {
                                                const p: Partial<Exercise> = { ...patch };
                                                if (p.weight !== undefined) p.weight = fromInputWeightToKg(Number(p.weight));
                                                await editExerciseFE(ex.id, p);
                                            }}
                                            onRemove={() => removeExerciseFE(ex.id)}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Mobile cards */}
                        <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-700">
                            {dayLog.exercises.length === 0 ? (
                                <div className="py-6 text-center text-slate-500 dark:text-slate-400">No exercises yet</div>
                            ) : (
                                dayLog.exercises.map((ex) => (
                                    <MobileExerciseCard
                                        key={ex.id}
                                        ex={{ ...ex, weight: showWeight(ex.weight) }}
                                        unit={unit}
                                        onChange={async (patch) => {
                                            const p: Partial<Exercise> = { ...patch };
                                            if (p.weight !== undefined) p.weight = fromInputWeightToKg(Number(p.weight));
                                            await editExerciseFE(ex.id, p);
                                        }}
                                        onRemove={() => removeExerciseFE(ex.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB */}
            <button
                onClick={() => setShowQuickAdd((v) => !v)}
                className="lg:hidden fixed bottom-5 right-5 h-12 w-12 rounded-full shadow-lg text-white bg-emerald-600 flex items-center justify-center"
                aria-label="Quick add"
                title="Quick add"
            >
                <Plus className="h-5 w-5" />
            </button>

            {showQuickAdd && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowQuickAdd(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-700 rounded-t-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">Quick Add</div>
                            <button onClick={() => setShowQuickAdd(false)} className="text-slate-500">
                                Close
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {presets.slice(0, 8).map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        applyPresetName(p.name);
                                        setShowQuickAdd(false);
                                    }}
                                    className="chip"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
