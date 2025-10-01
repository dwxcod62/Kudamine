export const ymdLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseISO = (s: string) => {
    const [y, m, dd] = s.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, dd ?? 1);
};

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfWeek = (d: Date) => addDays(d, -d.getDay());
export const isSameDay = (a: Date, b: Date) => ymdLocal(a) === ymdLocal(b);
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export const toYMD = (s: string) => s.slice(0, 10);
