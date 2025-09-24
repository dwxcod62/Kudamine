export function BarChart({ labels, values, max }: { labels: string[]; values: number[]; max: number }) {
    return (
        <div className="mt-4 grid grid-cols-7 gap-4 items-end h-56">
            {values.map((v, i) => {
                const h = `${Math.max(4, (v / max) * 100)}%`;
                return (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-8 rounded-xl" style={{ height: h, background: "var(--brand)" }} />
                        <div className="text-xs text-slate-500">{labels[i]}</div>
                    </div>
                );
            })}
        </div>
    );
}
