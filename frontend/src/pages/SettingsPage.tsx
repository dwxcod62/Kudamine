import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { MonthSelect } from "../components/MonthSelect";

type SpendingStatus = "Done" | "Process" | "Skip";
type ApplyScope = "single" | "next3" | "next6" | "next12" | "custom";

const API_BASE = import.meta.env.VITE_API_BASE as string;
const USER_ID = import.meta.env.VITE_USER_ID as string;

const monthKey = (d: Date | string) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const clampDue = (y: number, m1to12: number, day: number) => {
    const maxDay = new Date(y, m1to12, 0).getDate();
    const d = Math.min(Math.max(1, day), maxDay);
    return `${y}-${String(m1to12).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};
const addMonths = (yyyyMm: string, k: number) => {
    const [y, m] = yyyyMm.split("-").map(Number);
    const dt = new Date(y, m - 1 + k, 1);
    return monthKey(dt);
};
const monthsBetween = (start: string, end: string) => {
    const out: string[] = [];
    let cur = start;
    while (cur <= end) {
        out.push(cur);
        cur = addMonths(cur, 1);
    }
    return out;
};
const nowMonth = monthKey(new Date());

export default function SettingsPage() {
    const apiUrl = API_BASE;
    const userId = USER_ID;

    // chỉ cho chọn từ THÁNG HIỆN TẠI trở đi (ví dụ 18 tháng tới)
    const futureMonthOptions = useMemo(() => {
        const start = new Date();
        return Array.from({ length: 18 }, (_, i) => {
            const mk = monthKey(new Date(start.getFullYear(), start.getMonth() + i, 1));
            const [y, mm] = mk.split("-");
            return { value: mk, label: new Date(+y, +mm - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }) };
        });
    }, []);

    const [selectedMonth, setSelectedMonth] = useState(nowMonth);

    // quick add fields
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [dueDay, setDueDay] = useState<number>(1);
    const [status, setStatus] = useState<SpendingStatus>("Process");

    // apply to many
    const [apply, setApply] = useState<ApplyScope>("single");
    const [customFrom, setCustomFrom] = useState(nowMonth);
    const [customTo, setCustomTo] = useState(addMonths(nowMonth, 5)); // 6 tháng mặc định

    // nếu user cố chọn về quá khứ (bằng code khác), tự kéo lên hiện tại
    const normalizeMonth = (mk: string) => (mk < nowMonth ? nowMonth : mk);

    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const resolveMonths = (): string[] => {
        switch (apply) {
            case "single":
                return [selectedMonth];
            case "next3":
                return [0, 1, 2].map((i) => addMonths(selectedMonth, i));
            case "next6":
                return Array.from({ length: 6 }, (_, i) => addMonths(selectedMonth, i));
            case "next12":
                return Array.from({ length: 12 }, (_, i) => addMonths(selectedMonth, i));
            case "custom": {
                const from = normalizeMonth(customFrom);
                const to = normalizeMonth(customTo);
                const fixedFrom = from > to ? to : from; // đảm bảo from <= to
                const fixedTo = to;
                return monthsBetween(fixedFrom, fixedTo);
            }
        }
    };

    const onAdd = async () => {
        setMsg(null);
        setErr(null);
        if (!title.trim()) return setErr("Title is required");
        const amt = Number(amount);
        if (!isFinite(amt) || amt <= 0) return setErr("Amount must be a positive number");

        const months = resolveMonths();
        if (months.length === 0) return setErr("No months to apply.");

        const payloads = months.map((mk) => {
            const [y, m] = mk.split("-").map(Number);
            const dueDate = clampDue(y, m, dueDay);
            return {
                userId,
                title: title.trim(),
                dueDate,
                amount: amt,
                status,
                monthKey: mk,
            };
        });

        try {
            setSaving(true);
            const results = await Promise.allSettled(
                payloads.map((body) =>
                    fetch(`${API_BASE}/spending/entries`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    }).then(async (r) => {
                        if (!r.ok) throw new Error(await r.text());
                        return r.json();
                    })
                )
            );
            const ok = results.filter((r) => r.status === "fulfilled").length;
            const fail = results.length - ok;
            setMsg(`Created ${ok}/${results.length} entries${fail ? `, ${fail} failed` : ""}.`);
            setTitle("");
            setAmount("");
            setDueDay(1);
            setStatus("Process");
        } catch (e: any) {
            setErr(e?.message ?? "Create failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full w-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Spending — Quick Add (Future months only)</h1>

                {/* Base month */}
                <Section title="Base month">
                    <MonthSelect
                        value={selectedMonth}
                        onChange={(v) => {
                            const nv = normalizeMonth(v);
                            setSelectedMonth(nv);
                            setCustomFrom(nv);
                        }}
                        options={futureMonthOptions}
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Chỉ cho phép chọn từ <b>tháng hiện tại</b> trở đi.
                    </p>
                </Section>

                {/* Apply scope */}
                <Section title="Apply to">
                    <select
                        value={apply}
                        onChange={(e) => setApply(e.target.value as ApplyScope)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                        <option value="single">Only this month</option>
                        <option value="next3">This + next 2 months (3 total)</option>
                        <option value="next6">This + next 5 months (6 total)</option>
                        <option value="next12">This + next 11 months (12 total)</option>
                        <option value="custom">Custom range…</option>
                    </select>

                    {apply === "custom" && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From month</div>
                                <MonthSelect
                                    value={customFrom}
                                    onChange={(v) => setCustomFrom(normalizeMonth(v))}
                                    options={futureMonthOptions}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To month</div>
                                <MonthSelect
                                    value={customTo}
                                    onChange={(v) => setCustomTo(normalizeMonth(v))}
                                    options={futureMonthOptions}
                                    className="w-full"
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 md:col-span-2">
                                Phạm vi chỉ ở tương lai; nếu chọn ngược, hệ thống tự sửa <i>From ≤ To</i>.
                            </p>
                        </div>
                    )}
                </Section>

                {/* Form */}
                <Section title="Entry details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Title">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Rent / Housing"
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
                            />
                        </Field>
                        <Field label="Amount (USD)">
                            <input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="1200"
                                inputMode="decimal"
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
                            />
                        </Field>
                        <Field label="Due day (1–31)">
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={dueDay}
                                onChange={(e) => setDueDay(Number(e.target.value))}
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
                            />
                        </Field>
                        <Field label="Status">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as SpendingStatus)}
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="Process">Process</option>
                                <option value="Done">Done</option>
                                <option value="Skip">Skip</option>
                            </select>
                        </Field>
                    </div>

                    <div className="mt-5 flex items-center gap-2">
                        <button
                            onClick={onAdd}
                            disabled={saving}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white ${
                                saving ? "bg-emerald-400/60 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                        >
                            {saving ? <Loader /> : <Plus className="h-4 w-4" />}
                            Add entries
                        </button>
                        {msg && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                {msg}
                            </div>
                        )}
                        {err && <div className="text-xs text-rose-600 dark:text-rose-400">{err}</div>}
                    </div>
                </Section>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    API base: <code>{apiUrl}</code> • User: <code>{userId}</code>
                </p>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 mb-6 shadow">
            <div className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200">{title}</div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            {children}
        </div>
    );
}
function Loader() {
    return (
        <span className="inline-flex animate-spin">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" opacity="0.8" />
            </svg>
        </span>
    );
}
