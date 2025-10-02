import { Dumbbell, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { GymApi, type GymPreset } from "../lib/gymApi";
import { ALL_MUSCLE_TOKENS, TOKEN_TO_LABEL, toLabel, toToken, type MuscleToken } from "../utils/muscles";

const EMPTY_IMG = "https://picsum.photos/800/450";

export default function WorkoutPresetsPage() {
    /* ===== Data state ===== */
    // Có thể lấy từ API nếu BE trả list tokens; tạm dùng FE list
    const [muscles] = useState<MuscleToken[]>(ALL_MUSCLE_TOKENS);
    const [rows, setRows] = useState<GymPreset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ===== Filters/Search ===== */
    const [search, setSearch] = useState("");
    const [muscle, setMuscle] = useState<MuscleToken | "All">("All");

    /* ===== Dialog states ===== */
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    /* ===== Edit fields ===== */
    const [editName, setEditName] = useState("");
    const [editImage, setEditImage] = useState("");
    const [editMuscle, setEditMuscle] = useState<MuscleToken>("MiddleChest");
    const [editGuide, setEditGuide] = useState("");

    /* ===== Create fields ===== */
    const [cName, setCName] = useState("");
    const [cMuscle, setCMuscle] = useState<MuscleToken>("MiddleChest");
    const [cImage, setCImage] = useState("");
    const [cGuide, setCGuide] = useState("");

    /* ===== Load presets ===== */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setError(null);
                const presets = await GymApi.listPresets(); // ← không userId
                if (!alive) return;
                setRows(presets);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Load failed");
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    /* ===== Refetch when filter by muscle (server-side) ===== */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const presets = await GymApi.listPresets(muscle === "All" ? undefined : muscle);
                if (!alive) return;
                setRows(presets);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Load failed");
            } finally {
                if (alive) setLoading(false);
            }
        })();
    }, [muscle]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => (q ? r.name.toLowerCase().includes(q) || (r.instructions ?? "").toLowerCase().includes(q) : true));
    }, [rows, search]);

    /* ===== Actions ===== */
    const onDelete = (id: string) => setConfirmId(id);

    const handleConfirmDelete = async () => {
        if (!confirmId) return;
        try {
            await GymApi.deletePreset(confirmId);
            setRows((prev) => prev.filter((x) => x.id !== confirmId));
        } catch (e: any) {
            alert(e?.message ?? "Delete failed");
        } finally {
            setConfirmId(null);
        }
    };

    const startEdit = (id: string) => {
        const it = rows.find((r) => r.id === id);
        if (!it) return;
        setEditId(id);
        setEditName(it.name);
        setEditImage(it.imageUrl || "");
        setEditGuide(it.instructions || "");

        // nếu preset có nhiều targets, tạm chọn target đầu tiên
        const firstDetailRaw = it.targets[0]?.detail ?? "MiddleChest";
        setEditMuscle(toToken(firstDetailRaw) ?? "MiddleChest"); // map về token
    };

    const saveEdit = async () => {
        if (!editId) return;
        try {
            // 1) update meta
            await GymApi.updatePresetMeta(editId, {
                name: editName.trim(),
                imageUrl: editImage.trim(),
                instructions: editGuide.trim(),
            });

            // 2) đồng bộ targets: giữ 1 token (editMuscle)
            const current = await GymApi.getPreset(editId);
            const currentTokens = current.targets.map((t) => toToken(t.detail)).filter(Boolean) as MuscleToken[];

            const toRemove = currentTokens.filter((t) => t !== editMuscle);
            const needAdd = currentTokens.includes(editMuscle) ? [] : [editMuscle];

            await Promise.all([
                ...toRemove.map((t) => GymApi.removePresetTarget(editId, t)),
                ...(needAdd.length ? [GymApi.addPresetTargets(editId, needAdd)] : []),
            ]);

            // 3) refresh local
            const refreshed = await GymApi.getPreset(editId);
            setRows((prev) => prev.map((r) => (r.id === editId ? refreshed : r)));
            setEditId(null);
        } catch (e: any) {
            alert(e?.message ?? "Update failed");
        }
    };

    const openCreateDlg = () => {
        setCName("");
        setCMuscle("MiddleChest");
        setCImage("");
        setCGuide("");
        setCreateOpen(true);
    };

    const saveCreate = async () => {
        if (!cName.trim()) return alert("Name is required");
        try {
            const payload = {
                name: cName.trim(),
                ...(cImage.trim() ? { imageUrl: cImage.trim() } : {}),
                ...(cGuide.trim() ? { instructions: cGuide.trim() } : {}),
                targets: [cMuscle], // gửi token
            };
            const created = await GymApi.createPreset(payload);
            setRows((prev) => [created, ...prev]);
            setCreateOpen(false);
        } catch (e: any) {
            alert(e?.message ?? "Create failed");
        }
    };

    return (
        <div className="h-full w-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 p-6 transition-colors">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <Dumbbell className="h-6 w-6" />
                    Workout Presets
                </h2>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search preset…"
                            inputMode="search"
                            className="rounded-xl border px-4 py-3 pl-9 text-sm outline-none dark:bg-gray-800 dark:border-gray-700 w-full sm:w-[18rem]"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={muscle}
                            onChange={(e) => setMuscle(e.target.value as MuscleToken | "All")}
                            className="rounded-xl border px-4 py-3 text-sm outline-none dark:bg-gray-800 dark:border-gray-700"
                        >
                            <option value="All">All muscles</option>
                            {muscles.map((m) => (
                                <option key={m} value={m}>
                                    {TOKEN_TO_LABEL[m]}
                                </option>
                            ))}
                        </select>

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
            <div className="max-w-6xl mx-auto  rounded-xl  overflow-hidden">
                {error && <div className="p-4 text-rose-600 text-sm">{error}</div>}
                {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}

                {/* Mobile cards */}
                <div className="md:hidden space-y-6">
                    {filtered.map((r) => (
                        <div
                            key={r.id}
                            className="p-4 flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800"
                        >
                            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                <img src={r.imageUrl || EMPTY_IMG} alt={r.name} className="h-full w-full object-cover" />
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {r.targets[0]?.detail ? toLabel(r.targets[0].detail) : "—"}
                                    </div>
                                    <div className="text-base font-semibold">{r.name}</div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{r.instructions}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                <ActionBtn onClick={() => startEdit(r.id)} icon={<Pencil className="h-4 w-4" />} label="Edit" color="amber" />
                                <ActionBtn onClick={() => onDelete(r.id)} icon={<Trash2 className="h-4 w-4" />} label="Delete" color="rose" />
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && <div className="p-6 text-center text-gray-400">No presets</div>}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="px-5 py-3 text-left">Preset</th>
                                <th className="px-5 py-3 text-left">Muscle</th>
                                <th className="px-5 py-3 text-left">Guide</th>
                                <th className="px-5 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => (
                                <tr key={r.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-20 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                                <img src={r.imageUrl || EMPTY_IMG} alt={r.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="font-medium">{r.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">{r.targets[0]?.detail ? toLabel(r.targets[0].detail) : "—"}</td>
                                    <td className="px-5 py-3 max-w-xs">{r.instructions}</td>
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
                                    <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                                        No presets
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
                                <Pencil className="h-4 w-4" /> Edit preset
                            </div>
                            <button onClick={() => setEditId(null)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border rounded p-2" />

                            <label className="text-xs text-gray-500 dark:text-gray-400">Image URL</label>
                            <input value={editImage} onChange={(e) => setEditImage(e.target.value)} className="w-full border rounded p-2" />

                            <label className="text-xs text-gray-500 dark:text-gray-400">Muscle</label>
                            <select
                                value={editMuscle}
                                onChange={(e) => setEditMuscle(e.target.value as MuscleToken)}
                                className="w-full border rounded p-2"
                            >
                                {muscles.map((m) => (
                                    <option key={m} value={m}>
                                        {TOKEN_TO_LABEL[m]}
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
                                <Plus className="h-4 w-4" /> Create preset
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
                            <select value={cMuscle} onChange={(e) => setCMuscle(e.target.value as MuscleToken)} className="w-full border rounded p-2">
                                {muscles.map((m) => (
                                    <option key={m} value={m}>
                                        {TOKEN_TO_LABEL[m]}
                                    </option>
                                ))}
                            </select>
                            <input
                                value={cImage}
                                onChange={(e) => setCImage(e.target.value)}
                                placeholder="Image URL (optional)"
                                className="w-full border rounded p-2"
                            />
                            <textarea
                                value={cGuide}
                                onChange={(e) => setCGuide(e.target.value)}
                                placeholder="Guide (optional)"
                                className="w-full border rounded p-2"
                            />
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
                title="Delete preset"
                message="Are you sure you want to delete this preset?"
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
