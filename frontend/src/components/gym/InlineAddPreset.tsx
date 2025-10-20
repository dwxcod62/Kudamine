import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function InlineAddPreset({ onAdd }: { onAdd: (name: string) => void | Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const navigate = useNavigate();
    if (!open) {
        return (
            <button onClick={() => navigate("/preset")} className="btn-ghost text-sm">
                + Custom
            </button>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New preset"
                className="rounded-lg border px-3 py-2 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
            />
            <button
                onClick={async () => {
                    await onAdd(name);
                    setName("");
                    setOpen(false);
                }}
                className="btn text-sm"
            >
                Add
            </button>
            <button
                onClick={() => {
                    setName("");
                    setOpen(false);
                }}
                className="btn-ghost text-sm"
            >
                Cancel
            </button>
        </div>
    );
}
