/** =============== Date helpers =============== */
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);

const parseISO = (s: string) => {
    const [y, m, dd] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, dd ?? 1);
};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const startOfWeek = (d: Date) => addDays(d, -d.getDay()); // Sun

const isSameDay = (a: Date, b: Date) => fmtISO(a) === fmtISO(b);

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** =============== Unit helpers =============== */
const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
const lbToKg = (lb: number) => Math.round((lb / 2.20462) * 10) / 10;

/** =============== Normalizers (standalone) =============== */
// Các type cục bộ để helpers tự chứa, không đụng type ở nơi khác
type ExercisePlain = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number; // luôn là kg ở FE
    note: string;
};

type DayLogPlain = {
    id: string;
    date: string; // "YYYY-MM-DD"
    done: boolean;
    note: string | null;
    focus: string[];
    exercises: ExercisePlain[];
};

// Chuẩn ISO full -> "YYYY-MM-DD"
const toYMD = (s: string) => s.slice(0, 10);

// Map object day từ API (dateYmd ISO full, weightKg có thể là string)
const mapApiDayToFE = (d: any): DayLogPlain => ({
    id: d.id,
    date: toYMD(d.dateYmd),
    done: !!d.done,
    note: d.note ?? null,
    focus: (d?.focus ?? []).map((f: any) => (typeof f === "string" ? f : f?.tag)).filter(Boolean),
    exercises: (d?.exercises ?? []).map((e: any) => ({
        id: e.id,
        name: e.name,
        sets: Number(e.sets),
        reps: Number(e.reps),
        weight: Number(e.weightKg), // ép về number nếu BE trả string
        note: e.note ?? "",
    })),
});

// Sau khi update 1 day, gọi để đồng bộ lại FE state
async function refreshOneDay(dayId: string, setDays: React.Dispatch<React.SetStateAction<Record<string, DayLogPlain>>>) {
    const d = await (await import("../lib/gymApi")).GymApi.getDay(dayId);
    const ymd = toYMD(d.dateYmd);
    const mapped = mapApiDayToFE(d);
    setDays((prev) => ({ ...prev, [ymd]: { ...(prev[ymd] ?? {}), ...mapped } }));
}
