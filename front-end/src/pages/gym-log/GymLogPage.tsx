import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Dumbbell, Pencil, Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    note?: string;
};

type DayLog = {
    date: string;
    done: boolean;
    focus: string[];
    exercises: Exercise[];
    note?: string;
};

type LogsDB = Record<string, DayLog>;

type Unit = "kg" | "lb";

/** =============== Constants =============== */
const KEY_DB = "gym-logs.v1";
const KEY_UNIT = "gym-unit.v1";
const KEY_PRESETS = "gym-presets.v1";

const MUSCLE_PRESETS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Push", "Pull", "Full Body"];

const DEFAULT_EXERCISE_PRESETS = [
    "Bench Press",
    "Incline DB Press",
    "Lat Pulldown",
    "Barbell Row",
    "Squat",
    "Deadlift",
    "Overhead Press",
    "Bicep Curl",
    "Triceps Pushdown",
    "Plank",
];

/** =============== Date helpers =============== */
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);
const parseISO = (s: string) => {
    const [y, m, dd] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, dd ?? 1);
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfWeek = (d: Date) => addDays(d, -d.getDay()); // Sun
const isSameDay = (a: Date, b: Date) => fmtISO(a) === fmtISO(b);

/** =============== Unit helpers =============== */
const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
const lbToKg = (lb: number) => Math.round((lb / 2.20462) * 10) / 10;

/** =============== Hooks =============== */
function useLocalStorage<T>(key: string, init: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : init;
        } catch {
            return init;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {}
    }, [key, state]);
    return [state, setState] as const;
}

/** =============== Main Page =============== */
export function GymLogPage() {
    // state
    const [db, setDb] = useLocalStorage<LogsDB>(KEY_DB, {});
    const [unit, setUnit] = useLocalStorage<Unit>(KEY_UNIT, "kg");
    const [exercisePresets, setExercisePresets] = useLocalStorage<string[]>(KEY_PRESETS, DEFAULT_EXERCISE_PRESETS);

    const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

    // FAB quick-add on mobile
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    const selKey = fmtISO(selectedDate);
    const today = new Date();

    const dayLog: DayLog = useMemo(() => {
        return db[selKey] ?? { date: selKey, done: false, focus: [], exercises: [], note: "" };
    }, [db, selKey]);

    const setDayLog = (updater: (prev: DayLog) => DayLog) =>
        setDb((prev) => {
            const cur = prev[selKey] ?? dayLog;
            return { ...prev, [selKey]: updater(cur) };
        });

    // gợi ý mức tạ gần nhất của bài đó (base kg)
    const getLastWeightKg = (name: string) => {
        const keys = Object.keys(db).sort((a, b) => (a < b ? 1 : -1)); // gần nhất trước
        for (const k of keys) {
            const ex = db[k]?.exercises?.find((e) => e.name.toLowerCase() === name.toLowerCase());
            if (ex) return ex.weight;
        }
        return undefined;
    };

    // form add exercise
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
        setForm({ name, sets: 3, reps: 10, weight: Number(shown.toFixed(1)), note: "" });
        nameRef.current?.focus();
    };

    const addExercise = () => {
        const nm = form.name?.trim();
        if (!nm) {
            nameRef.current?.focus();
            return;
        }

        // convert display weight to base kg
        const baseKg = unit === "kg" ? Number(form.weight ?? 0) : lbToKg(Number(form.weight ?? 0));

        const ex: Exercise = {
            id: crypto.randomUUID(),
            name: nm,
            sets: Number(form.sets ?? 3),
            reps: Number(form.reps ?? 10),
            weight: Number(isNaN(baseKg) ? 0 : Math.max(0, baseKg)),
            note: form.note?.trim() || "",
        };
        setDayLog((p) => ({ ...p, exercises: [...p.exercises, ex] }));
        // giữ lại weight vừa nhập để lần sau auto-fill theo preset
        nameRef.current?.focus();
    };

    const editExercise = (id: string, patch: Partial<Exercise>) =>
        setDayLog((p) => ({
            ...p,
            exercises: p.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }));

    const removeExercise = (id: string) => setDayLog((p) => ({ ...p, exercises: p.exercises.filter((e) => e.id !== id) }));

    const toggleFocus = (tag: string) =>
        setDayLog((p) => {
            const has = p.focus.includes(tag);
            return { ...p, focus: has ? p.focus.filter((t) => t !== tag) : [...p.focus, tag] };
        });

    const toggleDone = () => setDayLog((p) => ({ ...p, done: !p.done }));

    // month label
    const monthLabel = useMemo(() => viewMonth.toLocaleString("en-US", { month: "long", year: "numeric" }), [viewMonth]);

    // map cho lịch (để vẽ dấu)
    const monthMap = useMemo(() => {
        const map = new Map<string, DayLog>();
        for (const [k, v] of Object.entries(db)) {
            const d = parseISO(k);
            if (d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth()) {
                map.set(k, v);
            }
        }
        return map;
    }, [db, viewMonth]);

    // unit switch hiển thị & chuyển đổi khi sửa rows
    const showWeight = (kg: number) => (unit === "kg" ? kg : kgToLb(kg));
    const fromInputWeightToKg = (val: number) => (unit === "kg" ? val : lbToKg(val));

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

            {/* Layout: calendar left (desktop) / week scroller (mobile) + details */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[360px,minmax(0,1fr)] gap-4 sm:gap-6">
                {/* Month calendar (>= lg) */}
                <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow">
                    <MonthCalendar viewMonth={viewMonth} selectedDate={selectedDate} onSelect={setSelectedDate} monthMap={monthMap} today={today} />
                </div>

                {/* Week scroller (mobile) */}
                <div className="lg:hidden">
                    <WeekScroller anchorDate={selectedDate} selectedDate={selectedDate} onSelect={setSelectedDate} today={today} monthMap={db} />
                </div>

                {/* Right: day details */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Day + Done + Focus + Unit (mobile unit switch) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow p-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Selected</div>
                                <div className="text-lg sm:text-xl font-bold">
                                    {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
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
                                    onClick={toggleDone}
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                                        dayLog.done
                                            ? "bg-emerald-500 text-white"
                                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                                    }`}
                                >
                                    <Check className="h-4 w-4" />
                                    {dayLog.done ? "Đã tập" : "Đánh dấu đã tập"}
                                </button>
                            </div>
                        </div>

                        {/* Focus chips */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {MUSCLE_PRESETS.map((m) => {
                                const active = dayLog.focus.includes(m);
                                return (
                                    <button
                                        key={m}
                                        onClick={() => toggleFocus(m)}
                                        className={`chip transition ${active ? "bg-emerald-500 !text-white" : ""}`}
                                        style={{ padding: ".35rem .65rem" }}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick add (presets) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus className="h-4 w-4 text-emerald-500" />
                            <div className="font-semibold">Presets</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {exercisePresets.map((p) => (
                                <button key={p} onClick={() => applyPresetName(p)} className="chip hover:opacity-90">
                                    {p}
                                </button>
                            ))}
                            {/* Simple add preset inline */}
                            <InlineAddPreset
                                onAdd={(name) => {
                                    if (!name.trim()) return;
                                    if (!exercisePresets.includes(name.trim())) setExercisePresets([...exercisePresets, name.trim()]);
                                    applyPresetName(name.trim());
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
                            <button onClick={addExercise} className="btn inline-flex items-center gap-2">
                                <Dumbbell className="h-4 w-4" />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Exercise table / list (mobile-friendly) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow overflow-hidden">
                        <table className="table w-full hidden sm:table">
                            <thead>
                                <tr>
                                    <th>Exercise</th>
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
                                            onEdit={(patch) => {
                                                const p: Partial<Exercise> = { ...patch };
                                                if (p.weight !== undefined) p.weight = fromInputWeightToKg(Number(p.weight));
                                                editExercise(ex.id, p);
                                            }}
                                            onRemove={() => removeExercise(ex.id)}
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
                                        onChange={(patch) => {
                                            const p: Partial<Exercise> = { ...patch };
                                            if (p.weight !== undefined) p.weight = fromInputWeightToKg(Number(p.weight));
                                            editExercise(ex.id, p);
                                        }}
                                        onRemove={() => removeExercise(ex.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB for mobile quick add */}
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
                            {exercisePresets.slice(0, 8).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        applyPresetName(p);
                                        setShowQuickAdd(false);
                                    }}
                                    className="chip"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** =================== Components =================== */

function MonthCalendar({
    viewMonth,
    selectedDate,
    onSelect,
    monthMap,
    today,
}: {
    viewMonth: Date;
    selectedDate: Date;
    onSelect: (d: Date) => void;
    monthMap: Map<string, DayLog>;
    today: Date;
}) {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const lead = first.getDay();
    const daysInMonth = last.getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    // prev tail
    const prevLast = endOfMonth(addMonths(viewMonth, -1)).getDate();
    for (let i = lead - 1; i >= 0; i--)
        cells.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, prevLast - i), inMonth: false });
    // current
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d), inMonth: true });
    // fill to 42
    while (cells.length < 42) {
        const lastCell = cells[cells.length - 1]?.date ?? last;
        const next = new Date(lastCell);
        next.setDate(next.getDate() + 1);
        cells.push({ date: next, inMonth: false });
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="p-4">
            <div className="grid grid-cols-7 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                {weekdays.map((w) => (
                    <div key={w} className="text-center">
                        {w}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {cells.map(({ date, inMonth }, idx) => {
                    const k = fmtISO(date);
                    const log = monthMap.get(k);
                    const selected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, today);
                    return (
                        <button
                            key={k + idx}
                            onClick={() => onSelect(date)}
                            className={`aspect-square rounded-xl border text-sm flex flex-col items-center justify-center transition hover:shadow-sm
                ${selected ? "border-emerald-500" : "border-slate-200 dark:border-slate-700"}
                ${inMonth ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50 text-slate-400"}`}
                        >
                            <div className="flex items-center gap-1">
                                <span className={`font-semibold ${isToday ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{date.getDate()}</span>
                                {log?.done && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                            </div>
                            <div className="mt-1 flex gap-1 flex-wrap justify-center max-w-[90%]">
                                {(log?.focus ?? []).slice(0, 2).map((t) => (
                                    <span
                                        key={t}
                                        className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    >
                                        {t}
                                    </span>
                                ))}
                                {(log?.focus?.length ?? 0) > 2 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        +{(log?.focus?.length ?? 0) - 2}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function WeekScroller({
    anchorDate,
    selectedDate,
    onSelect,
    today,
    monthMap,
}: {
    anchorDate: Date;
    selectedDate: Date;
    onSelect: (d: Date) => void;
    today: Date;
    monthMap: LogsDB;
}) {
    const start = startOfWeek(anchorDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow px-2 py-3">
            <div className="flex items-center justify-between px-2 mb-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Week</span>
                <span>{anchorDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
                {days.map((d) => {
                    const k = fmtISO(d);
                    const log = monthMap[k];
                    const selected = isSameDay(d, selectedDate);
                    const isToday = isSameDay(d, today);
                    return (
                        <button
                            key={k}
                            onClick={() => onSelect(d)}
                            className={`flex-1 min-w-[48px] aspect-square rounded-xl border text-sm flex flex-col items-center justify-center
                ${selected ? "border-emerald-500" : "border-slate-200 dark:border-slate-700"}
                ${log?.done ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-white dark:bg-slate-900"}`}
                            title={d.toDateString()}
                        >
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {d.toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                            <div className={`font-semibold ${isToday ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{d.getDate()}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function Stepper({
    label,
    value,
    onChange,
    step = 1,
    min = 0,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    step?: number;
    min?: number;
}) {
    return (
        <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
            <div className="flex items-center rounded-lg border dark:border-slate-700 overflow-hidden">
                <button
                    onClick={() => onChange(Math.max(min, Number((value - step).toFixed(1))))}
                    className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    -
                </button>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm outline-none bg-transparent"
                />
                <button
                    onClick={() => onChange(Number((value + step).toFixed(1)))}
                    className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    +
                </button>
            </div>
        </div>
    );
}

function DesktopExerciseRow({ ex, onEdit, onRemove }: { ex: Exercise; onEdit: (patch: Partial<Exercise>) => void; onRemove: () => void }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Exercise>(ex);
    useEffect(() => setDraft(ex), [ex.id]);

    if (!editing) {
        return (
            <tr className="border-t">
                <td className="px-3 py-2">{ex.name}</td>
                <td className="px-3 py-2">{ex.sets}</td>
                <td className="px-3 py-2">{ex.reps}</td>
                <td className="px-3 py-2">{ex.weight}</td>
                <td className="px-3 py-2 text-slate-500">{ex.note || "-"}</td>
                <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                        <button
                            onClick={() => setEditing(true)}
                            className="rounded-md border px-2 py-1 text-xs dark:border-slate-700 inline-flex items-center gap-1"
                        >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                            onClick={onRemove}
                            className="rounded-md border px-2 py-1 text-xs dark:border-slate-700 inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-t bg-slate-50 dark:bg-slate-800/40">
            <td className="px-3 py-2">
                <input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    value={draft.sets}
                    onChange={(e) => setDraft((d) => ({ ...d, sets: Number(e.target.value) }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    value={draft.reps}
                    onChange={(e) => setDraft((d) => ({ ...d, reps: Number(e.target.value) }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    value={draft.weight}
                    onChange={(e) => setDraft((d) => ({ ...d, weight: Number(e.target.value) }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    value={draft.note ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2 text-right">
                <div className="inline-flex gap-2">
                    <button
                        onClick={() => {
                            onEdit(draft);
                            setEditing(false);
                        }}
                        className="rounded-md border px-2 py-1 text-xs dark:border-slate-700 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                    >
                        <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                        onClick={() => {
                            setDraft(ex);
                            setEditing(false);
                        }}
                        className="rounded-md border px-2 py-1 text-xs dark:border-slate-700"
                    >
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    );
}

function MobileExerciseCard({
    ex,
    unit,
    onChange,
    onRemove,
}: {
    ex: Exercise;
    unit: Unit;
    onChange: (patch: Partial<Exercise>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{ex.name}</div>
                <button onClick={onRemove} className="text-rose-600 dark:text-rose-400 text-xs inline-flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
                <Stepper label="Sets" value={ex.sets} onChange={(v) => onChange({ sets: v })} />
                <Stepper label="Reps" value={ex.reps} onChange={(v) => onChange({ reps: v })} />
                <Stepper label={`Wt (${unit})`} value={ex.weight} onChange={(v) => onChange({ weight: v })} step={unit === "kg" ? 2.5 : 5} />
            </div>
            <input
                value={ex.note ?? ""}
                onChange={(e) => onChange({ note: e.target.value })}
                placeholder="Note"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
            />
        </div>
    );
}

function InlineAddPreset({ onAdd }: { onAdd: (name: string) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="btn-ghost text-sm">
                + Custom
            </button>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New preset"
                className="rounded-lg border px-3 py-2 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
            />
            <button
                onClick={() => {
                    onAdd(name);
                    setName("");
                    setOpen(false);
                }}
                className="btn text-sm"
            >
                Add
            </button>
            <button
                onClick={() => {
                    setName("");
                    setOpen(false);
                }}
                className="btn-ghost text-sm"
            >
                Cancel
            </button>
        </div>
    );
}
