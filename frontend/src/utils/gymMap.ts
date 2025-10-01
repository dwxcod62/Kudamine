import type { DayLogFE } from "../hooks/useGymData";
import { toYMD } from "./date";

export const mapApiDayToFE = (d: any): DayLogFE => ({
    id: d.id,
    date: toYMD(d.dateYmd),
    done: !!d.done,
    note: d.note ?? "",
    focus: (d.focus ?? []).map((f: any) => (typeof f === "string" ? f : f?.tag)).filter(Boolean),
    exercises: (d.exercises ?? []).map((e: any) => ({
        id: e.id,
        name: e.name,
        sets: Number(e.sets),
        reps: Number(e.reps),
        weight: Number(e.weightKg),
        note: e.note ?? "",
    })),
});

export async function refreshOneDay(dayId: string, setDays: React.Dispatch<React.SetStateAction<Record<string, DayLogFE>>>) {
    const d = await (await import("../lib/gymApi")).GymApi.getDay(dayId); // /gym/days/:id
    const ymd = toYMD(d.dateYmd);
    const mapped = mapApiDayToFE(d);
    setDays((prev) => ({ ...prev, [ymd]: { ...(prev[ymd] ?? {}), ...mapped } }));
}
