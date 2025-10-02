import { Check, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { MonthSelect } from "../components/MonthSelect";
import type { SpendingStatus } from "../lib/spendingApi";
import { deleteEntry, listEntries, listMonths, updateEntryStatus } from "../lib/spendingApi";
import { useAuthStore } from "../stores/auth";

type Status = SpendingStatus;
type Row = {
    id: string;
    title: string;
    dueDate: string; // ISO
    amount: number;
    status: Status;
};

const fmtMoney = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const monthKey = (d: string | Date) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export function SpendingPage() {
    // TODO: lấy từ auth/context của bạn
    const user = useAuthStore((s) => s.user);
    const userId = user?.id ?? "";

    const [rows, setRows] = useState<Row[]>([]);
    const [search, setSearch] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
    const [months, setMonths] = useState<string[]>([monthKey(new Date())]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [confirmId, setConfirmId] = useState<string | null>(null);

    // load entries theo user + month

    useEffect(() => {
        let cancelled = false;
        async function loadAllMonths() {
            if (!userId) return;
            try {
                const rows = await listMonths(userId);
                if (cancelled) return;

                const ms = rows.map((r) => r.monthKey);
                const set = new Set<string>([...ms, selectedMonth]);
                const sorted = Array.from(set).sort((a, b) => (a < b ? 1 : -1));
                setMonths(sorted);
            } catch (e: any) {
                if (!cancelled) {
                    console.error("Failed to load months:", e);
                }
            }
        }
        loadAllMonths();
        return () => {
            cancelled = true;
        };
    }, [userId]); // ⬅️ chỉ chạy khi có userId
    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoading(true);
            setErr(null);
            try {
                const data = await listEntries(userId, selectedMonth);
                if (cancelled) return;
                const ui = data
                    .map((e) => ({ id: e.id, title: e.title, dueDate: e.dueDate, amount: Number(e.amount), status: e.status }))
                    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
                setRows(ui);
            } catch (e: any) {
                setErr(e?.message ?? "Load failed");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => {
            cancelled = true;
        };
    }, [userId, selectedMonth]);

    const monthOptions = months.map((m) => {
        const [y, mm] = m.split("-");
        return {
            value: m,
            label: new Date(+y, +mm - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
        };
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => (q ? r.title.toLowerCase().includes(q) : true));
    }, [rows, search]);

    const onDelete = async (id: string) => {
        setConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!confirmId) return;
        try {
            await deleteEntry(confirmId);
            setRows((prev) => prev.filter((r) => r.id !== confirmId));
        } catch (e: any) {
            alert(e?.message ?? "Delete failed");
        } finally {
            setConfirmId(null);
        }
    };

    const total = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);
    const done = useMemo(() => filtered.filter((r) => r.status === "Done").reduce((s, r) => s + r.amount, 0), [filtered]);
    const remain = Math.max(0, total - done);
    const progress = total ? Math.round((done / total) * 100) : 0;

    const setStatus = async (id: string, status: Status) => {
        // optimistic update
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
        try {
            await updateEntryStatus(id, status);
        } catch (e) {
            // rollback nếu lỗi
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: prev.find((x) => x.id === id)?.status ?? r.status } : r)));
            alert("Update failed");
        }
    };

    return (
        <div className="h-full w-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 p-6 transition-colors">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold">Monthly Required Spending</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search item…"
                        inputMode="search"
                        className="rounded-xl border px-4 py-3 text-sm outline-none dark:bg-gray-800 dark:border-gray-700 w-full"
                    />
                    <MonthSelect
                        density="compact"
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        options={monthOptions}
                        className="w-full sm:w-[16rem]"
                    />
                </div>
            </div>

            {/* Summary cards: 1 cột mobile, 3 cột md+ */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                <SummaryCard label="Total (required)" value={fmtMoney(total)} />
                <SummaryCard label="Done" value={fmtMoney(done)} />
                <SummaryCard label="Remaining" value={fmtMoney(remain)} />
            </div>

            {/* Progress */}
            <div className="max-w-6xl mx-auto mb-6">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Table */}
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
                {err && <div className="p-4 text-sm text-rose-600 dark:text-rose-400 border-b dark:border-gray-700">{err}</div>}

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {loading && <div className="p-6 text-center text-gray-400">Loading…</div>}
                    {!loading && filtered.length === 0 && <div className="p-10 text-center text-gray-400">No items in this month</div>}
                    {!loading &&
                        filtered.map((r) => (
                            <div key={r.id} className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(r.dueDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "2-digit",
                                            year: "numeric",
                                        })}
                                    </div>
                                    <StatusPill status={r.status} />
                                </div>
                                <div className="text-base font-medium">{r.title}</div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">Amount</div>
                                    <div className="text-base font-semibold">{fmtMoney(r.amount)}</div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <ActionBtn
                                        active={r.status === "Done"}
                                        onClick={() => setStatus(r.id, "Done")}
                                        icon={<Check className="h-4 w-4" />}
                                        label="Done"
                                        color="emerald"
                                    />
                                    <ActionBtn
                                        active={r.status === "Process"}
                                        onClick={() => setStatus(r.id, "Process")}
                                        icon={<Loader2 className="h-4 w-4" />}
                                        label="Process"
                                        color="amber"
                                    />
                                    <ActionBtn
                                        active={r.status === "Skip"}
                                        onClick={() => setStatus(r.id, "Skip")}
                                        icon={<X className="h-4 w-4" />}
                                        label="Skip"
                                        color="rose"
                                    />
                                    <ActionBtn onClick={() => onDelete(r.id)} icon={<Trash2 className="h-4 w-4" />} label="Delete" color="rose" />
                                </div>
                            </div>
                        ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="px-5 py-3 text-left">Due Date</th>
                                <th className="px-5 py-3 text-left">Title</th>
                                <th className="px-5 py-3 text-right">Amount</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                                        Loading…
                                    </td>
                                </tr>
                            )}
                            {!loading &&
                                filtered.map((r) => (
                                    <tr key={r.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-5 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            {new Date(r.dueDate).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "2-digit",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-3">{r.title}</td>
                                        <td className="px-5 py-3 text-right font-semibold">{fmtMoney(r.amount)}</td>
                                        <td className="px-5 py-3">
                                            <StatusPill status={r.status} />
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex gap-2">
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    <ActionBtn
                                                        active={r.status === "Done"}
                                                        onClick={() => setStatus(r.id, "Done")}
                                                        icon={<Check className="h-4 w-4" />}
                                                        label="Done"
                                                        color="emerald"
                                                    />
                                                    <ActionBtn
                                                        active={r.status === "Process"}
                                                        onClick={() => setStatus(r.id, "Process")}
                                                        icon={<Loader2 className="h-4 w-4" />}
                                                        label="Process"
                                                        color="amber"
                                                    />
                                                    <ActionBtn
                                                        active={r.status === "Skip"}
                                                        onClick={() => setStatus(r.id, "Skip")}
                                                        icon={<X className="h-4 w-4" />}
                                                        label="Skip"
                                                        color="rose"
                                                    />
                                                    <ActionBtn
                                                        onClick={() => onDelete(r.id)}
                                                        icon={<Trash2 className="h-4 w-4" />}
                                                        label="Delete"
                                                        color="rose"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                                        No items in this month
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmDialog
                open={!!confirmId}
                title="Delete entry"
                message="Are you sure you want to delete this entry? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
}

/* ---- Helpers ---- */

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white border rounded-xl p-4 shadow dark:bg-slate-800 dark:border-slate-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
    );
}

function StatusPill({ status }: { status: Status }) {
    const map: Record<Status, string> = {
        Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        Process: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        Skip: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${map[status]}`}>{status}</span>;
}

function ActionBtn({
    active,
    onClick,
    icon,
    label,
    color,
}: {
    active?: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color: "emerald" | "amber" | "rose";
}) {
    const base = {
        emerald: "bg-emerald-500 hover:bg-emerald-600",
        amber: "bg-amber-500 hover:bg-amber-600",
        rose: "bg-rose-500 hover:bg-rose-600",
    }[color];
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white transition ${
                active ? base : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}
