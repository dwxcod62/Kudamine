import { Dumbbell, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";

/* ========= Taxonomy ========= */

// Chi tiết mới
type MuscleDetailed =
    // Chest
    | "Upper Chest"
    | "Middle Chest"
    | "Lower Chest"
    // Back
    | "Lats"
    | "Upper Back"
    | "Lower Back"
    // Shoulders
    | "Front Delts"
    | "Lateral Delts"
    | "Rear Delts"
    // Arms
    | "Biceps"
    | "Triceps"
    | "Forearms"
    // Legs
    | "Quads"
    | "Hamstrings"
    | "Glutes"
    | "Calves"
    // Core
    | "Abs"
    | "Obliques"
    // Other
    | "Full Body";

// Giữ legacy để code cũ/mocks không lỗi, nhưng sẽ normalize lúc load
type LegacyMuscle = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Push" | "Pull" | "Full Body";

// Muscle cuối dùng trong app (đã normalize về nhóm chi tiết)
export type Muscle = MuscleDetailed | LegacyMuscle;

// Dùng cho filter hiển thị (optgroup)
const MUSCLE_OPTIONS_GROUPED: Array<{ label: string; items: MuscleDetailed[] }> = [
    { label: "Chest", items: ["Upper Chest", "Middle Chest", "Lower Chest"] },
    { label: "Back", items: ["Lats", "Upper Back", "Lower Back"] },
    { label: "Shoulders", items: ["Front Delts", "Lateral Delts", "Rear Delts"] },
    { label: "Arms", items: ["Biceps", "Triceps", "Forearms"] },
    { label: "Legs", items: ["Quads", "Hamstrings", "Glutes", "Calves"] },
    { label: "Core", items: ["Abs", "Obliques"] },
    { label: "Other", items: ["Full Body"] },
];

// Dùng cho dropdown Edit/Create (không cần optgroup)
const MUSCLES_FLAT: MuscleDetailed[] = MUSCLE_OPTIONS_GROUPED.flatMap((g) => g.items);

/* ========= Types & Mocks ========= */

type WorkoutEntry = {
    id: string;
    name: string;
    muscle: Muscle; // sẽ normalize về MuscleDetailed khi load
    imageUrl: string;
    instructions: string; // Guide
    maxWeight: number; // PR cao nhất (lb)
    lastPerformed?: string;
};

const MOCKS: WorkoutEntry[] = [
    {
        id: "w1",
        name: "Barbell Bench Press",
        muscle: "Chest",
        imageUrl: "https://images.unsplash.com/photo-1517963628607-235ccdd5476f?q=80&w=1200&auto=format&fit=crop",
        instructions:
            "Lie on the bench, grip slightly wider than shoulder-width, lower the bar to mid-chest, press up while keeping your back tight and feet planted.",
        maxWeight: 225,
        lastPerformed: "2025-09-25T10:00:00.000Z",
    },
    {
        id: "w2",
        name: "Deadlift",
        muscle: "Back",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
        instructions: "Hinge at hips, keep back neutral, brace core, push the floor away. Bar travels close to shins. Lock out with glutes.",
        maxWeight: 405,
        lastPerformed: "2025-09-20T07:30:00.000Z",
    },
    {
        id: "w3",
        name: "Back Squat",
        muscle: "Legs",
        imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2f35d7?q=80&w=1200&auto=format&fit=crop",
        instructions: "Set bar on mid-traps, stance shoulder-width, sit down between hips, keep knees tracking toes, drive up powerfully.",
        maxWeight: 315,
        lastPerformed: "2025-08-30T08:00:00.000Z",
    },
];

/* ========= Helpers ========= */

const fmtWeight = (n: number) => `${n.toLocaleString("en-US")} lb`;

// Quy tắc normalize từ legacy -> chi tiết
function normalizeMuscleByName(entry: WorkoutEntry): MuscleDetailed | "Full Body" {
    const n = entry.name.toLowerCase();
    // Ưu tiên rule theo tên bài
    if (n.includes("incline") && n.includes("press")) return "Upper Chest";
    if (n.includes("bench") || n.includes("press")) return "Middle Chest";
    if (n.includes("dip") || n.includes("decline")) return "Lower Chest";
    if (n.includes("overhead") || n.includes("ohp")) return "Front Delts";
    if (n.includes("lateral raise")) return "Lateral Delts";
    if (n.includes("rear delt")) return "Rear Delts";
    if (n.includes("curl")) return "Biceps";
    if (n.includes("triceps") || n.includes("skull")) return "Triceps";
    if (n.includes("deadlift")) return "Lower Back"; // hoặc "Full Body"
    if (n.includes("squat")) return "Quads";
    if (n.includes("rdl") || n.includes("romanian")) return "Hamstrings";
    if (n.includes("calf")) return "Calves";
    if (n.includes("lat pulldown") || n.includes("pull-down")) return "Lats";
    if (n.includes("row")) return "Upper Back";
    if (n.includes("plank") || n.includes("crunch")) return "Abs";
    if (n.includes("side plank")) return "Obliques";

    // Nếu không match theo tên, map từ legacy muscle rộng
    switch (entry.muscle) {
        case "Chest":
            return "Middle Chest";
        case "Back":
            return "Lats";
        case "Legs":
            return "Quads";
        case "Shoulders":
            return "Lateral Delts";
        case "Arms":
            return "Biceps";
        case "Core":
            return "Abs";
        case "Full Body":
            return "Full Body";
        default:
            // Push/Pull hoặc case khác -> để tạm Full Body cho an toàn
            return "Full Body";
    }
}

/* ========= Component ========= */

export default function WorkoutPageMock() {
    const [rows, setRows] = useState<WorkoutEntry[]>([]);
    const [search, setSearch] = useState("");
    const [muscle, setMuscle] = useState<MuscleDetailed | "All">("All");

    // dialogs
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    // edit fields (dùng taxonomy chi tiết)
    const [editImage, setEditImage] = useState("");
    const [editMuscle, setEditMuscle] = useState<MuscleDetailed>("Middle Chest");
    const [editGuide, setEditGuide] = useState("");

    // create fields (dùng taxonomy chi tiết)
    const [cName, setCName] = useState("");
    const [cMuscle, setCMuscle] = useState<MuscleDetailed>("Middle Chest");
    const [cImage, setCImage] = useState("");
    const [cGuide, setCGuide] = useState("");
    const [cPR, setCPR] = useState<string>("0");

    // Load + normalize mocks
    useEffect(() => {
        const normalized = MOCKS.map((it) => ({
            ...it,
            muscle: normalizeMuscleByName(it), // ép về nhóm chi tiết
        }));
        setRows(normalized);
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            const nameHit = q ? r.name.toLowerCase().includes(q) : true;
            const muscleHit = muscle === "All" ? true : r.muscle === muscle;
            return nameHit && muscleHit;
        });
    }, [rows, search, muscle]);

    // Actions
    const onDelete = (id: string) => setConfirmId(id);
    const handleConfirmDelete = () => {
        if (!confirmId) return;
        setRows((prev) => prev.filter((r) => r.id !== confirmId));
        setConfirmId(null);
    };

    const startEdit = (id: string) => {
        const it = rows.find((r) => r.id === id);
        if (!it) return;
        setEditId(id);
        setEditImage(it.imageUrl);
        setEditMuscle(it.muscle as MuscleDetailed); // đã normalize
        setEditGuide(it.instructions);
    };
    const saveEdit = () => {
        if (!editId) return;
        setRows((prev) => prev.map((r) => (r.id === editId ? { ...r, imageUrl: editImage.trim(), muscle: editMuscle, instructions: editGuide } : r)));
        setEditId(null);
    };

    const openCreateDlg = () => {
        setCName("");
        setCMuscle("Middle Chest");
        setCImage("");
        setCGuide("");
        setCPR("0");
        setCreateOpen(true);
    };
    const saveCreate = () => {
        if (!cName.trim()) return alert("Name is required");
        const pr = Number(cPR);
        if (Number.isNaN(pr) || pr < 0) return alert("PR must be non-negative");
        const newItem: WorkoutEntry = {
            id: "w" + Math.random().toString(36).slice(2, 9),
            name: cName.trim(),
            muscle: cMuscle, // dùng nhóm chi tiết
            imageUrl: cImage.trim() || "https://picsum.photos/800/450",
            instructions: cGuide.trim() || "—",
            maxWeight: pr,
            lastPerformed: new Date().toISOString(),
        };
        setRows((prev) => [newItem, ...prev]);
        setCreateOpen(false);
    };

    return (
        <div className="h-full w-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 p-6 transition-colors">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <Dumbbell className="h-6 w-6" />
                    Workout Personal Records (Mock)
                </h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search exercise…"
                            inputMode="search"
                            className="rounded-xl border px-4 py-3 pl-9 text-sm outline-none dark:bg-gray-800 dark:border-gray-700 w-full sm:w-[18rem]"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Filter theo optgroup */}
                        <select
                            value={muscle}
                            onChange={(e) => setMuscle(e.target.value as MuscleDetailed | "All")}
                            className="rounded-xl border px-4 py-3 text-sm outline-none dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="All">All muscles</option>
                            {MUSCLE_OPTIONS_GROUPED.map((g) => (
                                <optgroup key={g.label} label={g.label}>
                                    {g.items.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>

                        {/* Create */}
                        <button
                            onClick={openCreateDlg}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Plus className="h-4 w-4" /> Create
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 overflow-hidden">
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map((r) => (
                        <div key={r.id} className="p-4 flex flex-col gap-3">
                            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{r.muscle}</div>
                                    <div className="text-base font-semibold">{r.name}</div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{r.instructions}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">PR</div>
                                    <div className="text-base font-bold">{fmtWeight(r.maxWeight)}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <ActionBtn onClick={() => startEdit(r.id)} icon={<Pencil className="h-4 w-4" />} label="Edit" color="amber" />
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
                                <th className="px-5 py-3 text-left">Exercise</th>
                                <th className="px-5 py-3 text-left">Muscle</th>
                                <th className="px-5 py-3 text-left">Guide</th>
                                <th className="px-5 py-3 text-right">PR</th>
                                <th className="px-5 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => (
                                <tr key={r.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-20 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="font-medium">{r.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">{r.muscle}</td>
                                    <td className="px-5 py-3 max-w-xs">{r.instructions}</td>
                                    <td className="px-5 py-3 text-right font-semibold">{fmtWeight(r.maxWeight)}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-2">
                                            <ActionBtn
                                                onClick={() => startEdit(r.id)}
                                                icon={<Pencil className="h-4 w-4" />}
                                                label="Edit"
                                                color="amber"
                                            />
                                            <ActionBtn
                                                onClick={() => onDelete(r.id)}
                                                icon={<Trash2 className="h-4 w-4" />}
                                                label="Delete"
                                                color="rose"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                                        No workouts
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit dialog */}
            {editId && (
                <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
                    <div className="max-w-lg w-full rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow">
                        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                            <div className="font-semibold flex items-center gap-2">
                                <Pencil className="h-4 w-4" /> Edit workout
                            </div>
                            <button onClick={() => setEditId(null)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Image URL</label>
                            <input value={editImage} onChange={(e) => setEditImage(e.target.value)} className="w-full border rounded p-2" />
                            <label className="text-xs text-gray-500 dark:text-gray-400">Muscle</label>
                            <select
                                value={editMuscle}
                                onChange={(e) => setEditMuscle(e.target.value as MuscleDetailed)}
                                className="w-full border rounded p-2"
                            >
                                {MUSCLES_FLAT.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Guide</label>
                            <textarea
                                value={editGuide}
                                onChange={(e) => setEditGuide(e.target.value)}
                                className="w-full border rounded p-2"
                                rows={4}
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditId(null)} className="px-4 py-2 bg-gray-100 rounded">
                                    Cancel
                                </button>
                                <button onClick={saveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create dialog */}
            {createOpen && (
                <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-4">
                    <div className="max-w-lg w-full rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow">
                        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                            <div className="font-semibold flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Create workout
                            </div>
                            <button onClick={() => setCreateOpen(false)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <input
                                value={cName}
                                onChange={(e) => setCName(e.target.value)}
                                placeholder="Name"
                                className="w-full border rounded p-2"
                            />
                            <select
                                value={cMuscle}
                                onChange={(e) => setCMuscle(e.target.value as MuscleDetailed)}
                                className="w-full border rounded p-2"
                            >
                                {MUSCLES_FLAT.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <input
                                value={cImage}
                                onChange={(e) => setCImage(e.target.value)}
                                placeholder="Image URL"
                                className="w-full border rounded p-2"
                            />
                            <textarea
                                value={cGuide}
                                onChange={(e) => setCGuide(e.target.value)}
                                placeholder="Guide"
                                className="w-full border rounded p-2"
                            />
                            <input value={cPR} onChange={(e) => setCPR(e.target.value)} placeholder="PR (lb)" className="w-full border rounded p-2" />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setCreateOpen(false)} className="px-4 py-2 bg-gray-100 rounded">
                                    Cancel
                                </button>
                                <button onClick={saveCreate} className="px-4 py-2 bg-emerald-600 text-white rounded">
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!confirmId}
                title="Delete workout"
                message="Are you sure you want to delete this workout?"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
}

/* ========= Small UI ========= */
function ActionBtn({ onClick, icon, label, color }: { onClick: () => void; icon: React.ReactNode; label: string; color: "amber" | "rose" }) {
    const base = { amber: "bg-amber-500 hover:bg-amber-600", rose: "bg-rose-500 hover:bg-rose-600" }[color];
    return (
        <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-white ${base}`}>
            {icon}
            <span>{label}</span>
        </button>
    );
}
