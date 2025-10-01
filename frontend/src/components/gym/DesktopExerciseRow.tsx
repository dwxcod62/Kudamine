import { Check, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
    note?: string | null;
};

export function DesktopExerciseRow({ ex, onEdit, onRemove }: { ex: Exercise; onEdit: (patch: Partial<Exercise>) => void; onRemove: () => void }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<Exercise>(ex);
    useEffect(() => setDraft(ex), [ex.id]);

    if (!editing) {
        return (
            <tr className="border-t">
                <td className="px-3 py-2">{ex.name}</td>
                <td className="px-3 py-2">{ex.sets}</td>
                <td className="px-3 py-2">{ex.reps}</td>
                <td className="px-3 py-2">{ex.weight}</td>
                <td className="px-3 py-2 text-slate-500">{ex.note || "-"}</td>
                <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                        <button
                            onClick={() => setEditing(true)}
                            className="rounded-md border px-2 py-1 text-xs dark:border-slate-700 inline-flex items-center gap-1"
                        >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                            onClick={onRemove}
                            className="rounded-md border px-2 py-1 text-xs dark:border-slate-700 inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-t bg-slate-50 dark:bg-slate-800/40">
            <td className="px-3 py-2">
                <input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    value={draft.sets}
                    onChange={(e) => setDraft((d) => ({ ...d, sets: Number(e.target.value) }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    value={draft.reps}
                    onChange={(e) => setDraft((d) => ({ ...d, reps: Number(e.target.value) }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="number"
                    value={draft.weight}
                    onChange={(e) => setDraft((d) => ({ ...d, weight: Number(e.target.value) }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    value={draft.note ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                    className="w-full rounded-lg border px-2 py-1 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
                />
            </td>
            <td className="px-3 py-2 text-right">
                <div className="inline-flex gap-2">
                    <button
                        onClick={() => {
                            onEdit(draft);
                            setEditing(false);
                        }}
                        className="rounded-md border px-2 py-1 text-xs dark:border-slate-700 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                    >
                        <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                        onClick={() => {
                            setDraft(ex);
                            setEditing(false);
                        }}
                        className="rounded-md border px-2 py-1 text-xs dark:border-slate-700"
                    >
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    );
}
