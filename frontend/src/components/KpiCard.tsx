export function KpiCard({
    title,
    tag,
    value,
    delta,
    deltaClass,
}: {
    title: string;
    tag?: string;
    value: string;
    delta?: string;
    deltaClass?: string;
}) {
    return (
        <div className="box p-4 kpi">
            <div className="flex items-center justify-between">
                <h3>{title}</h3>
                {tag && <span className="tag">{tag}</span>}
            </div>
            <div className="val">{value}</div>
            {delta && <div className={`${deltaClass ?? "text-slate-500"} text-sm font-semibold`}>{delta}</div>}
        </div>
    );
}
