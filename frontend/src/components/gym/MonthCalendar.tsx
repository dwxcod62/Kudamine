import { Check } from "lucide-react";
import type { DayLogFE } from "../../hooks/useGymData";
import { addMonths, endOfMonth, isSameDay, startOfMonth, ymdLocal } from "../../utils/date";

export function MonthCalendar({
    viewMonth,
    selectedDate,
    onSelect,
    monthMap,
    today,
}: {
    viewMonth: Date;
    selectedDate: Date;
    onSelect: (d: Date) => void;
    monthMap: Map<string, DayLogFE>;
    today: Date;
}) {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const lead = first.getDay();
    const daysInMonth = last.getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    const prevLast = endOfMonth(addMonths(viewMonth, -1)).getDate();
    for (let i = lead - 1; i >= 0; i--)
        cells.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, prevLast - i), inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d), inMonth: true });
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
                    const k = ymdLocal(date);
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
