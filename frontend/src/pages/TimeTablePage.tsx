// src/pages/TimeTablePage.tsx
import { CalendarDays, ChevronLeft, ChevronRight, Filter, PenLine, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { COLOR_CHOICES, useTimetable, type TimePresetId } from "../hooks/useTimetable";

function formatWeekRange(weekStartYmd: string) {
    const d = new Date(weekStartYmd + "T00:00:00Z");
    const mon = new Date(d);
    const sun = new Date(d);
    sun.setUTCDate(sun.getUTCDate() + 6);
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (x: Date) => `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
    return `${fmt(mon)} — ${fmt(sun)}`;
}

function WeekNav({
    weekStart,
    shiftWeek,
    goThisWeek,
}: {
    weekStart: string;
    shiftWeek: (deltaDays: number) => void;
    goThisWeek?: () => void; // optional
}) {
    return (
        <div
            className="inline-flex items-center gap-2  sm:gap-3"
            role="group"
            aria-label="Week navigation"
            onKeyDown={(e) => {
                if (e.key === "ArrowLeft") shiftWeek(-7);
                if (e.key === "ArrowRight") shiftWeek(+7);
            }}
            tabIndex={0}
        >
            {/* Prev */}
            <button
                onClick={() => shiftWeek(-7)}
                className="shrink-0 rounded-xl border px-2 py-2 text-sm dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                aria-label="Previous week"
                title="Previous week"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Label chip */}
            <div
                className="rounded-xl ring-1 ring-slate-200 bg-white dark:bg-slate-800
                px-3 py-2 text-sm flex items-center gap-2 mx-1"
            >
                {" "}
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span className="font-medium">{formatWeekRange(weekStart)}</span>
            </div>

            {/* Next */}
            <button
                onClick={() => shiftWeek(+7)}
                className="shrink-0  rounded-xl border px-2 py-2 text-sm dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                aria-label="Next week"
                title="Next week"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

const TIME_PRESETS = [
    { id: "auto", label: "Auto by tag (smart)" },
    { id: "24h", label: "Full 24h (00:00–24:00)" },
    { id: "day", label: "Daytime (06:00–22:00)" },
    { id: "work", label: "Work (08:00–18:00)" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function TimeTablePage() {
    const {
        STEP,
        CELL_PX,
        weekStart,
        shiftWeek,
        timePreset,
        setTimePreset,
        tags,
        tagOptions,
        tagFilter,
        setTagFilter,
        search,
        setSearch,
        byDay,
        hours,
        GRID_START,
        loading,
        error,
        minToLabel,
        clamp,
        addQuick,
        moveEvent,
        changeDuration,
        updateFields,
        deleteById,
        includeExpired,
        setIncludeExpired,
    } = useTimetable();

    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [editing, setEditing] = useState<UIEditing | null>(null);
    const [mobileDay, setMobileDay] = useState<number>(() => {
        const js = new Date().getDay(); // 0=Sun..6=Sat
        return js ? (js + 6) % 7 : 0;
    });

    // DnD + resize
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
        if (id) moveEvent(id, day, newMin);
    };
    const preventCtx = (e: React.SyntheticEvent) => e.preventDefault();

    // resize
    const resizeRef = useRef<{ id: string; startMin: number; colTop: number } | null>(null);
    const startResize = (id: string, colEl: HTMLElement | null, startMin: number) => {
        if (!colEl) return;
        resizeRef.current = { id, startMin, colTop: colEl.getBoundingClientRect().top };
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
        changeDuration(ctx.id, newDur);
    };
    const endResize = () => {
        resizeRef.current = null;
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", onResizing);
        window.removeEventListener("mouseup", endResize);
        window.removeEventListener("touchmove", onResizingTouch);
        window.removeEventListener("touchend", endResize);
    };

    // ui
    return (
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen" onContextMenu={preventCtx}>
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Left cluster: Title + WeekNav */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 opacity-80" />
                        <h2 className="text-lg sm:text-2xl font-semibold">Weekly Timetable</h2>
                    </div>

                    {/* WeekNav không còn ml-3, chống co & không xuống dòng */}
                    <div className="shrink-0 whitespace-nowrap">
                        <WeekNav weekStart={weekStart} shiftWeek={shiftWeek} goThisWeek={() => shiftWeek(0)} />
                    </div>
                </div>

                {/* Right cluster: Filters (đẩy sang phải ở sm+) */}
                {/* Right cluster: Filters, preset, search */}
                <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto flex-nowrap min-w-0">
                    <Filter className="h-4 w-4 opacity-70 hidden sm:block" />

                    {/* Tag filter */}
                    <select
                        value={tagFilter === "All" ? "" : (tagFilter as any).id}
                        onChange={(e) => {
                            const id = e.target.value;
                            if (!id) setTagFilter("All");
                            else {
                                const t = tags.find((x) => x.id === id)!;
                                setTagFilter({ id: t.id, name: t.name });
                            }
                        }}
                        className="rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700 flex-shrink-0"
                    >
                        {tagOptions.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>

                    {/* Time preset */}
                    <select
                        value={timePreset}
                        onChange={(e) => setTimePreset(e.target.value as TimePresetId)}
                        className="rounded-lg border px-2 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700 flex-shrink-0"
                    >
                        {TIME_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>

                    {/* Search */}
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search…"
                        className="rounded-lg border px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700 w-40 sm:w-56 flex-shrink"
                    />
                </div>
            </div>

            {/* ======== MOBILE (one-day) ======== */}
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

                {/* Grid */}
                <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                    <div className="px-3 py-2 sticky top-0 z-10 bg-gray-100 dark:bg-gray-700/70 backdrop-blur flex items-center justify-between">
                        <div className="font-medium">{DAYS[mobileDay]}</div>
                        <button
                            onClick={() => addQuick(mobileDay)}
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
                        {/* time col */}
                        <div className="border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                            {hours.map((m) => (
                                <div key={m} className="h-9 sm:h-10 text-[11px] px-1 pt-1 text-gray-500 dark:text-gray-400">
                                    {m % 60 === 0 ? minToLabel(m) : ""}
                                </div>
                            ))}
                        </div>

                        {/* day col */}
                        <div className="relative">
                            {hours.map((m, i) => (
                                <div
                                    key={m}
                                    className={`h-9 sm:h-10 border-t dark:border-gray-700 ${i % 2 ? "bg-gray-50/60 dark:bg-gray-800/50" : ""}`}
                                />
                            ))}

                            {byDay[mobileDay].map((ev) => {
                                const top = ((ev.startMin - GRID_START) / STEP) * CELL_PX;
                                const height = (ev.duration / STEP) * CELL_PX;
                                return (
                                    <div
                                        key={ev.id}
                                        data-evt
                                        draggable
                                        onDragStart={onDragStart(ev.id)}
                                        onDoubleClick={() =>
                                            setEditing({ id: ev.id, title: ev.title, color: ev.color, tagId: ev.tagId, endDate: ev.endDate })
                                        }
                                        className={`absolute left-2 right-2 ${ev.color} text-white rounded-lg shadow active:cursor-grabbing`}
                                        style={{ top, height }}
                                    >
                                        <div className="px-2 py-1 text-xs">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="font-semibold line-clamp-2">{ev.title}</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() =>
                                                            setEditing({
                                                                id: ev.id,
                                                                title: ev.title,
                                                                color: ev.color,
                                                                tagId: ev.tagId,
                                                                endDate: ev.endDate,
                                                            })
                                                        }
                                                        className="opacity-85"
                                                    >
                                                        <PenLine className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(ev.id)} className="opacity-85">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="opacity-90 mt-0.5">
                                                {minToLabel(ev.startMin)}–{minToLabel(ev.startMin + ev.duration)} • {ev.tagName}
                                            </div>
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 border border-white/20">
                                                    {ev.status}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-[11px] opacity-80">{ev.endDate && <>Expires: {ev.endDate}</>}</div>
                                        </div>

                                        {/* handle */}
                                        <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                                            <div
                                                onMouseDown={(e) => {
                                                    const col = (e.currentTarget as HTMLElement).closest("[data-col]") as HTMLElement;
                                                    startResize(ev.id, col, ev.startMin);
                                                }}
                                                onTouchStart={(e) => {
                                                    const col = (e.currentTarget as HTMLElement).closest("[data-col]") as HTMLElement;
                                                    startResize(ev.id, col, ev.startMin);
                                                }}
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
                    onClick={() => addQuick(mobileDay)}
                    className="fixed bottom-5 right-5 z-40 md:hidden h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg flex items-center justify-center"
                    aria-label="Add block"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            {/* ======== DESKTOP (7 cols) ======== */}
            <div className="max-w-6xl mx-auto hidden md:block">
                <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-[64px_repeat(7,1fr)]">
                        {/* time col */}
                        <div className="border-right dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                            {hours.map((m) => (
                                <div key={m} className="h-10 text-[10px] sm:text-xs px-1 pt-1 text-gray-500 dark:text-gray-400">
                                    {m % 60 === 0 ? minToLabel(m) : ""}
                                </div>
                            ))}
                        </div>

                        {/* day cols */}
                        {DAYS.map((d, day) => (
                            <div key={day} className="border-l dark:border-gray-700">
                                <div className="sticky top-0 bg-gray-100 dark:bg-gray-700/70 px-2 py-1.5 flex items-center justify-between">
                                    <span className="font-medium">{d}</span>
                                    <button
                                        onClick={() => addQuick(day)}
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
                                    {hours.map((m, i) => (
                                        <div
                                            key={m}
                                            className={`h-10 border-t dark:border-gray-700 ${i % 2 ? "bg-gray-50/50 dark:bg-gray-800/60" : ""}`}
                                        />
                                    ))}

                                    {byDay[day].map((ev) => {
                                        const top = ((ev.startMin - GRID_START) / STEP) * 40; // desktop 40px
                                        const height = (ev.duration / STEP) * 40;
                                        return (
                                            <div
                                                key={ev.id}
                                                data-evt
                                                draggable
                                                onDragStart={onDragStart(ev.id)}
                                                onDoubleClick={() =>
                                                    setEditing({ id: ev.id, title: ev.title, color: ev.color, tagId: ev.tagId, endDate: ev.endDate })
                                                }
                                                className={`absolute left-1 right-1 ${ev.color} text-white rounded-lg cursor-grab active:cursor-grabbing shadow`}
                                                style={{ top, height }}
                                            >
                                                <div className="px-2 py-1 text-xs sm:text-sm">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-semibold">{ev.title}</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() =>
                                                                    setEditing({
                                                                        id: ev.id,
                                                                        title: ev.title,
                                                                        color: ev.color,
                                                                        tagId: ev.tagId,
                                                                        endDate: ev.endDate,
                                                                    })
                                                                }
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
                                                        {minToLabel(ev.startMin)}–{minToLabel(ev.startMin + ev.duration)} • {ev.tagName}
                                                        {ev.endDate && <> • Expires: {ev.endDate}</>}
                                                    </div>
                                                </div>

                                                {/* handle */}
                                                <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                                                    <div
                                                        onMouseDown={(e) => {
                                                            const col = (e.currentTarget as HTMLElement).closest("[data-col]") as HTMLElement;
                                                            startResize(ev.id, col, ev.startMin);
                                                        }}
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
                        deleteById(confirmDelete);
                        setConfirmDelete(null);
                    }}
                />
            )}

            {/* Edit dialog */}
            {editing && (
                <EditDialog
                    tags={tagOptions.filter((t) => t.id)} // exclude "All"
                    ev={editing}
                    onCancel={() => setEditing(null)}
                    onSave={(p) => {
                        updateFields(editing.id, p);
                        setEditing(null);
                    }}
                />
            )}

            {loading && <div className="max-w-6xl mx-auto mt-3 text-sm opacity-70">Loading…</div>}
            {error && <div className="max-w-6xl mx-auto mt-3 text-sm text-rose-500">Error: {error}</div>}
        </div>
    );
}

/* ===== Dialogs & Types ===== */
type UIEditing = { id: string; title: string; color: string; tagId: string | null; endDate: string | null };

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

function EditDialog({
    ev,
    tags,
    onCancel,
    onSave,
}: {
    ev: UIEditing;
    tags: Array<{ id: string; name: string }>;
    onCancel: () => void;
    onSave: (p: { title?: string; color?: string; tagId?: string | null; endDate?: string | null }) => void;
}) {
    const [title, setTitle] = useState(ev.title);
    const [color, setColor] = useState(ev.color);
    const [tagId, setTagId] = useState<string | null>(ev.tagId);
    const [endDate, setEndDate] = useState<string | null>(ev.endDate);
    const [noExpired, setNoExpired] = useState(!ev.endDate);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50" onContextMenu={(e) => e.preventDefault()}>
            <div className="bg-white dark:bg-gray-800 w-full md:w-[min(90vw,440px)] md:rounded-xl md:border dark:border-gray-700 rounded-t-2xl p-5">
                <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mb-3 md:hidden" />
                <div className="text-lg font-semibold mb-3">Edit Block</div>

                <div className="space-y-3">
                    {/* Title */}
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

                    {/* Tag & Color */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Tag</label>
                            <select
                                value={tagId ?? ""}
                                onChange={(e) => setTagId(e.target.value || null)}
                                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value="">(none / Personal)</option>
                                {tags.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500">Color</label>
                            <div className="flex gap-2 mt-1 flex-wrap">
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

                    {/* Expired day */}
                    <div>
                        <label className="text-xs text-gray-500">Expired day</label>
                        <div className="flex items-center gap-3 mt-1">
                            <input
                                type="date"
                                value={endDate ?? ""}
                                onChange={(e) => setEndDate(e.target.value || null)}
                                disabled={noExpired}
                                className={`w-[160px] rounded-md border px-2 py-[5px] text-[13px] leading-none dark:bg-gray-700 dark:border-gray-600 ${
                                    noExpired ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 select-none">
                                <input
                                    type="checkbox"
                                    checked={noExpired}
                                    onChange={(e) => setNoExpired(e.target.checked)}
                                    className="accent-emerald-500 h-4 w-4"
                                />
                                No expired day
                            </label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-5">
                    <button onClick={onCancel} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave({ title, color, tagId, endDate: noExpired ? null : endDate })}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
