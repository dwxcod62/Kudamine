import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayLogFE } from "../../hooks/useGymData";
import { addDays, isSameDay, startOfWeek, ymdLocal } from "../../utils/date";

type DaysDB = Record<string, DayLogFE>;

export function WeekScroller({
    anchorDate,
    selectedDate,
    onSelect,
    today,
    monthMap,
    onShift,
}: {
    anchorDate: Date;
    selectedDate: Date;
    onSelect: (d: Date) => void;
    today: Date;
    monthMap: DaysDB;
    onShift: (days: number) => void;
}) {
    const start = startOfWeek(anchorDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const rangeLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${addDays(
        start,
        6
    ).getDate()}, ${start.getFullYear()}`;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 shadow px-2 py-3">
            <div className="flex items-center justify-between px-2 mb-1 text-xs text-slate-500 dark:text-slate-400">
                <button
                    onClick={() => onShift(-7)}
                    className="rounded-md border px-2 py-1 dark:border-slate-700"
                    aria-label="Previous week"
                    title="Previous week"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <span>{rangeLabel}</span>

                <button
                    onClick={() => onShift(7)}
                    className="rounded-md border px-2 py-1 dark:border-slate-700"
                    aria-label="Next week"
                    title="Next week"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
                {days.map((d) => {
                    const k = ymdLocal(d);
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
