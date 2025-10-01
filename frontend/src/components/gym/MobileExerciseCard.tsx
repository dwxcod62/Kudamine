import { Trash2 } from "lucide-react";
import type { Unit } from "../../utils/units";
import type { Exercise } from "./DesktopExerciseRow";
import { Stepper } from "./Stepper";

export function MobileExerciseCard({
    ex,
    unit,
    onChange,
    onRemove,
}: {
    ex: Exercise;
    unit: Unit;
    onChange: (patch: Partial<Exercise>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{ex.name}</div>
                <button onClick={onRemove} className="text-rose-600 dark:text-rose-400 text-xs inline-flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
                <Stepper label="Sets" value={ex.sets} onChange={(v) => onChange({ sets: v })} />
                <Stepper label="Reps" value={ex.reps} onChange={(v) => onChange({ reps: v })} />
                <Stepper label={`Wt (${unit})`} value={ex.weight} onChange={(v) => onChange({ weight: v })} step={unit === "kg" ? 2.5 : 5} />
            </div>
            <input
                value={ex.note ?? ""}
                onChange={(e) => onChange({ note: e.target.value })}
                placeholder="Note"
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none dark:bg-slate-800 dark:border-slate-700"
            />
        </div>
    );
}
