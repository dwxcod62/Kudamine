export function Stepper({
    label,
    value,
    onChange,
    step = 1,
    min = 0,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    step?: number;
    min?: number;
}) {
    return (
        <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
            <div className="flex items-center rounded-lg border dark:border-slate-700 overflow-hidden">
                <button
                    onClick={() => onChange(Math.max(min, Number((value - step).toFixed(1))))}
                    className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    -
                </button>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm outline-none bg-transparent"
                />
                <button
                    onClick={() => onChange(Number((value + step).toFixed(1)))}
                    className="px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    +
                </button>
            </div>
        </div>
    );
}
