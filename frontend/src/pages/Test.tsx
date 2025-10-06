import { CalendarDays, Filter, PenLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ==== Config ==== */
const STEP = 30; // minutes per cell
const CELL_PX = 36; // mobile nhỏ hơn 1 chút cho gọn (desktop sẽ vẫn ok)

/* ==== Types ==== */
type Status = "Planned" | "InProgress" | "Done" | "Canceled";
type Tag = "All" | "Class" | "Study" | "Work" | "Club" | "Sport" | "Personal";
type TTEvent = {
    id: string;
    title: string;
    day: number; // 0=Mon ... 6=Sun
    startMin: number; // minutes from 00:00
    duration: number; // minutes
    status: Status;
    color: string; // tailwind bg-* token
    tag: Exclude<Tag, "All">;
};

/* ==== Consts ==== */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const COLOR_CHOICES = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-blue-500", "bg-fuchsia-500"];
const TAGS: Tag[] = ["All", "Class", "Study", "Work", "Club", "Sport", "Personal"];
const LS_KEY = "timetable.mobile.v1";

export const TIME_PRESETS = [
    { id: "auto", label: "Auto by tag (smart)" },
    { id: "24h", label: "Full 24h (00:00–24:00)" },
    { id: "day", label: "Daytime (06:00–22:00)" },
    { id: "work", label: "Work (08:00–18:00)" },
] as const;
type TimePresetId = (typeof TIME_PRESETS)[number]["id"];

/* ==== Utils ==== */
const pad = (n: number) => String(n).padStart(2, "0");
const minToLabel = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const uid = () => Math.random().toString(36).slice(2, 10);

/* ==== Page ==== */
export default function TimeTablePage() {
    // Data
    const [events, setEvents] = useState<TTEvent[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        } catch {
            return [];
        }
    });
    useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(events)), [events]);

    // UI state
    const [tagFilter, setTagFilter] = useState<Tag>("All");
    const [timePreset, setTimePreset] = useState<TimePresetId>("auto");
    const [search, setSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [editing, setEditing] = useState<TTEvent | null>(null);
    const [mobileDay, setMobileDay] = useState<number>(new Date().getDay() ? (new Date().getDay() + 6) % 7 : 0); // convert Sun=0 -> 6

    // Filter
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return events.filter((e) => (tagFilter === "All" || e.tag === tagFilter) && (!q || e.title.toLowerCase().includes(q)));
    }, [events, tagFilter, search]);

    // Dynamic time window
    const { GRID_START, GRID_END } = useMemo(() => {
        const FULL_DAY = 24 * 60;
        if (timePreset === "24h") return { GRID_START: 0, GRID_END: FULL_DAY };
        if (timePreset === "day") return { GRID_START: 6 * 60, GRID_END: 22 * 60 };
        if (timePreset === "work") return { GRID_START: 8 * 60, GRID_END: 18 * 60 };

        const pool = tagFilter === "All" ? events : events.filter((e) => e.tag === tagFilter);
        if (!pool.length) return { GRID_START: 6 * 60, GRID_END: 22 * 60 };

        const minStart = Math.min(...pool.map((e) => e.startMin));
        const maxEnd = Math.max(...pool.map((e) => e.startMin + e.duration));
        const padMin = 60;
        const start = clamp(Math.floor((minStart - padMin) / STEP) * STEP, 0, 24 * 60 - STEP);
        const end = clamp(Math.ceil((maxEnd + padMin) / STEP) * STEP, start + STEP, 24 * 60);
        return { GRID_START: start, GRID_END: end };
    }, [events, tagFilter, timePreset]);

    const hours = useMemo(() => {
        const arr: number[] = [];
        for (let m = GRID_START; m <= GRID_END; m += STEP) arr.push(m);
        return arr;
    }, [GRID_START, GRID_END]);

    // CRUD
    const updateEvent = (id: string, patch: Partial<TTEvent>) => setEvents((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const deleteEvent = (id: string) => setEvents((p) => p.filter((x) => x.id !== id));
    const addEventQuick = (day: number) => {
        const base = GRID_START + 60 * (Math.random() * 2);
        const e: TTEvent = {
            id: uid(),
            title: "New Block",
            day,
            startMin: Math.round(base / STEP) * STEP,
            duration: 60,
            color: COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)],
            tag: tagFilter === "All" ? "Personal" : tagFilter,
            status: "Planned",
        };
        setEvents((prev) => [...prev, e]);
    };

    // DnD (mouse left) & Pointer support (touch)
    const onDragStart = (id: string) => (ev: React.DragEvent) => {
        if ((ev as any).button !== undefined && (ev as any).button !== 0) return;
        ev.dataTransfer.setData("application/x-tt", id);
        ev.dataTransfer.effectAllowed = "move";
    };
    const onDrop = (day: number) => (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const row = Math.floor(y / CELL_PX);
        const newMin = GRID_START + row * STEP;
        const id = e.dataTransfer.getData("application/x-tt");
        const evn = events.find((x) => x.id === id);
        if (evn) {
            const snapped = Math.round(newMin / STEP) * STEP;
            updateEvent(id, { day, startMin: clamp(snapped, 0, 24 * 60 - evn.duration) });
        }
    };

    // Resize (pointer + mouse)
    const resizeRef = useRef<{ id: string; startMin: number; colTop: number } | null>(null);
    const startResize = (id: string, colEl: HTMLElement | null) => {
        const evn = events.find((x) => x.id === id);
        if (!colEl || !evn) return;
        resizeRef.current = { id, startMin: evn.startMin, colTop: colEl.getBoundingClientRect().top };
        document.body.style.cursor = "ns-resize";
        window.addEventListener("mousemove", onResizing);
        window.addEventListener("mouseup", endResize);
        window.addEventListener("touchmove", onResizingTouch, { passive: false });
        window.addEventListener("touchend", endResize);
    };
    const onResizing = (e: MouseEvent) => {
        const ctx = resizeRef.current;
        if (!ctx) return;
        const relY = e.clientY - ctx.colTop;
        applyResizeFromRelY(ctx, relY);
    };
    const onResizingTouch = (e: TouchEvent) => {
        const ctx = resizeRef.current;
        if (!ctx) return;
        e.preventDefault();
        const t = e.touches[0];
        const relY = t.clientY - ctx.colTop;
        applyResizeFromRelY(ctx, relY);
    };
    const applyResizeFromRelY = (ctx: { id: string; startMin: number }, relY: number) => {
        const rows = Math.max(0, Math.round(relY / CELL_PX));
        const endMin = GRID_START + rows * STEP;
        const newDur = clamp(endMin - ctx.startMin, STEP, 24 * 60 - ctx.startMin);
        updateEvent(ctx.id, { duration: newDur });
    };
    const endResize = () => {
        resizeRef.current = null;
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onResizing);
        window.removeEventListener("mouseup", endResize);
        window.removeEventListener("touchmove", onResizingTouch);
        window.removeEventListener("touchend", endResize);
    };

    // Group by day
    const byDay = useMemo(() => {
        const map: Record<number, TTEvent[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        for (const e of filtered) map[e.day].push(e);
        Object.values(map).forEach((a) => a.sort((x, y) => x.startMin - y.startMin));
        return map;
    }, [filtered]);

    // Context menu guard
    const preventCtx = (e: React.SyntheticEvent) => e.preventDefault();

    /* ==================== RENDER ==================== */
    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen" onContextMenu={preventCtx}>
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-3 sm:mb-4 flex flex-col sm:flex-row justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 opacity-80" />
                    <h2 className="text-lg sm:text-2xl font-semibold">Weekly Timetable</h2>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="h-4 w-4 opacity-70 hidden sm:block" />
                    <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value as Tag)}
                        className="rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
                    >
                        {TAGS.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>
                    <select
                        value={timePreset}
                        onChange={(e) => setTimePreset(e.target.value as TimePresetId)}
                        className="rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
                    >
                        {TIME_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="rounded-lg border px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700 w-full sm:w-56"
                    />
                </div>
            </div>

            {/* ======== MOBILE VIEW (one day) ======== */}
            <div className="max-w-6xl mx-auto md:hidden">
                {/* Day chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                    {DAYS.map((d, i) => (
                        <button
                            key={d}
                            onClick={() => setMobileDay(i)}
                            className={`snap-start px-3 py-1.5 rounded-full text-sm border ${
                                mobileDay === i
                                    ? "bg-emerald-500 text-white border-emerald-500"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                {/* Grid for selected day */}
                <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                    <div className="px-3 py-2 sticky top-0 z-10 bg-gray-100 dark:bg-gray-700/70 backdrop-blur flex items-center justify-between">
                        <div className="font-medium">{DAYS[mobileDay]}</div>
                        <button
                            onClick={() => addEventQuick(mobileDay)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                        </button>
                    </div>

                    <div
                        data-col
                        className="grid grid-cols-[48px_1fr] relative"
                        onContextMenu={preventCtx}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDrop(mobileDay)}
                    >
                        {/* time column (compact) */}
                        <div className="border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                            {hours.map((m) => (
                                <div key={m} className="h-9 sm:h-10 text-[11px] px-1 pt-1 text-gray-500 dark:text-gray-400">
                                    {m % 60 === 0 ? minToLabel(m) : ""}
                                </div>
                            ))}
                        </div>

                        {/* day column */}
                        <div className="relative">
                            {/* background rows */}
                            {hours.map((m, i) => (
                                <div
                                    key={m}
                                    className={`h-9 sm:h-10 border-t dark:border-gray-700 ${i % 2 ? "bg-gray-50/60 dark:bg-gray-800/50" : ""}`}
                                />
                            ))}

                            {/* events */}
                            {byDay[mobileDay].map((ev) => {
                                const top = ((ev.startMin - GRID_START) / STEP) * CELL_PX;
                                const height = (ev.duration / STEP) * CELL_PX;
                                return (
                                    <div
                                        key={ev.id}
                                        data-evt
                                        draggable
                                        onDragStart={onDragStart(ev.id)}
                                        onDoubleClick={() => setEditing(ev)}
                                        className={`absolute left-2 right-2 ${ev.color} text-white rounded-lg shadow active:cursor-grabbing`}
                                        style={{ top, height }}
                                    >
                                        <div className="px-2 py-1 text-xs">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-semibold line-clamp-2">{ev.title}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => setEditing(ev)} className="opacity-85">
                                                        <PenLine className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(ev.id)} className="opacity-85">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="opacity-90 mt-0.5">
                                                {minToLabel(ev.startMin)}–{minToLabel(ev.startMin + ev.duration)} • {ev.tag}
                                            </div>
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 border border-white/20">
                                                    {ev.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* bottom handle (touch-friendly) */}
                                        <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                                            <div
                                                onMouseDown={(e) =>
                                                    startResize(ev.id, (e.currentTarget as HTMLElement).closest("[data-col]") as HTMLElement)
                                                }
                                                onTouchStart={(e) =>
                                                    startResize(ev.id, (e.currentTarget as HTMLElement).closest("[data-col]") as HTMLElement)
                                                }
                                                className="h-4 w-12 bg-white/60 border border-white/50 rounded-lg cursor-ns-resize"
                                                title="Drag to resize"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* FAB */}
                <button
                    onClick={() => addEventQuick(mobileDay)}
                    className="fixed bottom-5 right-5 z-40 md:hidden h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center"
                    aria-label="Add block"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            {/* ======== DESKTOP VIEW (7 columns) ======== */}
            <div className="max-w-6xl mx-auto hidden md:block">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-[64px_repeat(7,1fr)]">
                        {/* time column */}
                        <div className="border-right dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                            {hours.map((m) => (
                                <div key={m} className="h-10 text-[10px] sm:text-xs px-1 pt-1 text-gray-500 dark:text-gray-400">
                                    {m % 60 === 0 ? minToLabel(m) : ""}
                                </div>
                            ))}
                        </div>

                        {/* day columns */}
                        {DAYS.map((d, day) => (
                            <div key={day} className="border-l dark:border-gray-700">
                                <div className="sticky top-0 bg-gray-100 dark:bg-gray-700/70 px-2 py-1.5 flex items-center justify-between">
                                    <span className="font-medium">{d}</span>
                                    <button
                                        onClick={() => addEventQuick(day)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-1 rounded"
                                    >
                                        + Add
                                    </button>
                                </div>

                                <div
                                    data-col
                                    className="relative"
                                    onContextMenu={preventCtx}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDrop(day)}
                                >
                                    {/* background */}
                                    {hours.map((m, i) => (
                                        <div
                                            key={m}
                                            className={`h-10 border-t dark:border-gray-700 ${i % 2 ? "bg-gray-50/50 dark:bg-gray-800/60" : ""}`}
                                        />
                                    ))}

                                    {/* events */}
                                    {byDay[day].map((ev) => {
                                        const top = ((ev.startMin - GRID_START) / STEP) * 40; // desktop 40px/step
                                        const height = (ev.duration / STEP) * 40;
                                        return (
                                            <div
                                                key={ev.id}
                                                data-evt
                                                draggable
                                                onDragStart={onDragStart(ev.id)}
                                                onDoubleClick={() => setEditing(ev)}
                                                className={`absolute left-1 right-1 ${ev.color} text-white rounded-lg cursor-grab active:cursor-grabbing shadow`}
                                                style={{ top, height }}
                                            >
                                                <div className="px-2 py-1 text-xs sm:text-sm">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-semibold">{ev.title}</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => setEditing(ev)}
                                                                title="Edit"
                                                                className="opacity-80 hover:opacity-100"
                                                            >
                                                                <PenLine className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(ev.id)}
                                                                title="Delete"
                                                                className="opacity-80 hover:opacity-100"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs opacity-90">
                                                        {minToLabel(ev.startMin)}–{minToLabel(ev.startMin + ev.duration)} • {ev.tag}
                                                    </div>
                                                    <div className="mt-1">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 border border-white/20">
                                                            {ev.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* resize handle */}
                                                <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                                                    <div
                                                        onMouseDown={(e) =>
                                                            startResize(ev.id, (e.currentTarget as HTMLElement).closest("[data-col]") as HTMLElement)
                                                        }
                                                        className="h-3 w-10 bg-white/50 border border-white/40 rounded cursor-ns-resize"
                                                        title="Drag to resize"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confirm delete */}
            {confirmDelete && (
                <ConfirmDialog
                    onCancel={() => setConfirmDelete(null)}
                    onConfirm={() => {
                        deleteEvent(confirmDelete);
                        setConfirmDelete(null);
                    }}
                />
            )}

            {/* Edit dialog (rename + color + tag) — trên mobile hiển thị dạng bottom-sheet */}
            {editing && (
                <EditDialog
                    ev={editing}
                    onCancel={() => setEditing(null)}
                    onSave={(p) => {
                        updateEvent(editing.id, p);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

/* ==== Dialogs ==== */
function ConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-white dark:bg-gray-800 w-full md:w-[min(90vw,380px)] md:rounded-xl md:border dark:border-gray-700 rounded-t-2xl p-5">
                <div className="text-lg font-semibold mb-2">Delete block</div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete this block?</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditDialog({ ev, onCancel, onSave }: { ev: TTEvent; onCancel: () => void; onSave: (p: Partial<TTEvent>) => void }) {
    const [title, setTitle] = useState(ev.title);
    const [color, setColor] = useState(ev.color);
    const [tag, setTag] = useState<Tag>(ev.tag);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-white dark:bg-gray-800 w-full md:w-[min(90vw,440px)] md:rounded-xl md:border dark:border-gray-700 rounded-t-2xl p-5">
                <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-3 md:hidden" />
                <div className="text-lg font-semibold mb-3">Edit Block</div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500">Title</label>
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Enter a title"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Tag</label>
                            <select
                                value={tag}
                                onChange={(e) => setTag(e.target.value as Tag)}
                                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                            >
                                {TAGS.filter((t) => t !== "All").map((t) => (
                                    <option key={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Color</label>
                            <div className="flex gap-2 mt-1">
                                {COLOR_CHOICES.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`h-7 w-7 rounded-full ${c} border-2 ${
                                            color === c ? "border-white ring-2 ring-offset-2 ring-emerald-400" : "border-white/50"
                                        }`}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button onClick={onCancel} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave({ title, color, tag: tag as Exclude<Tag, "All"> })}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
