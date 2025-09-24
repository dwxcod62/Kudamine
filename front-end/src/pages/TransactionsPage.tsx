import { Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MonthSelect } from "../components/MonthSelect";

type Status = "Done" | "Process" | "Skip";
type Row = {
    id: string;
    title: string;
    dueDate: string;
    amount: number;
    status: Status;
};

const initialRows: Row[] = [
    { id: "1", title: "Rent / Housing", dueDate: "2025-09-01", amount: 1200, status: "Done" },
    { id: "2", title: "Utilities", dueDate: "2025-09-05", amount: 180, status: "Process" },
    { id: "3", title: "Internet", dueDate: "2025-09-07", amount: 60, status: "Done" },
    { id: "4", title: "Groceries", dueDate: "2025-09-10", amount: 350, status: "Process" },
    { id: "5", title: "Transportation", dueDate: "2025-09-12", amount: 120, status: "Skip" },
    { id: "6", title: "Subscriptions", dueDate: "2025-09-15", amount: 45, status: "Process" },
    { id: "7", title: "Emergency Fund", dueDate: "2025-09-28", amount: 150, status: "Process" },
];

const fmtMoney = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const monthKey = (d: string | Date) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export function TransactionsPage() {
    const [rows, setRows] = useState<Row[]>(initialRows);
    const [search, setSearch] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
    const [dark] = useState(false);

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [dark]);

    const months = useMemo(() => {
        const s = new Set(rows.map((r) => monthKey(r.dueDate)));
        return Array.from(s).sort((a, b) => (a < b ? 1 : -1));
    }, [rows]);

    const monthOptions = months.map((m) => {
        const [y, mm] = m.split("-");
        return {
            value: m,
            label: new Date(+y, +mm - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
        };
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows
            .filter((r) => monthKey(r.dueDate) === selectedMonth)
            .filter((r) => (q ? r.title.toLowerCase().includes(q) : true))
            .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
    }, [rows, selectedMonth, search]);

    const total = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);
    const done = useMemo(() => filtered.filter((r) => r.status === "Done").reduce((s, r) => s + r.amount, 0), [filtered]);
    const remain = Math.max(0, total - done);
    const progress = total ? Math.round((done / total) * 100) : 0;

    const setStatus = (id: string, status: Status) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    return (
        <div className="h-full w-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 p-6 transition-colors">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Monthly Required Spending</h2>
                <div className="flex gap-2 items-center">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search item…"
                        className="rounded-lg border px-3 py-2 text-sm outline-none dark:bg-gray-800 dark:border-gray-700"
                    />
                    <MonthSelect value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} className="w-full" />
                </div>
            </div>

            {/* Summary cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Table */}
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
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
                        {filtered.map((r) => (
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
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
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
