export function Avatar({ seed }: { seed: number }) {
    const url = `https://i.pravatar.cc/40?img=${(seed % 70) + 1}`;
    return <img src={url} className="h-8 w-8 rounded-full" alt="avatar" />;
}

// ---------- File: src/components/charts/Donut.tsx ----------
export function Donut({ valueA, valueB, valueC }: { valueA: number; valueB: number; valueC: number }) {
    const total = valueA + valueB + valueC;
    const a = (valueA / total) * 100,
        b = (valueB / total) * 100,
        c = (valueC / total) * 100;
    const R = 70,
        C = 2 * Math.PI * R;
    const offA = 0,
        offB = C * (a / 100),
        offC = C * ((a + b) / 100);
    return (
        <svg viewBox="0 0 180 180" className="mx-auto">
            <g transform="translate(90,90)">
                <circle r={R} fill="none" stroke="#eef2f5" strokeWidth={18} />
                <circle
                    r={R}
                    fill="none"
                    stroke="#cfe6e0"
                    strokeWidth={18}
                    strokeDasharray={`${(C * c) / 100} ${C}`}
                    strokeDashoffset={-offC}
                    strokeLinecap="round"
                />
                <circle
                    r={R}
                    fill="none"
                    stroke="#9ec8be"
                    strokeWidth={18}
                    strokeDasharray={`${(C * b) / 100} ${C}`}
                    strokeDashoffset={-offB}
                    strokeLinecap="round"
                />
                <circle
                    r={R}
                    fill="none"
                    stroke="#0f6b5f"
                    strokeWidth={18}
                    strokeDasharray={`${(C * a) / 100} ${C}`}
                    strokeDashoffset={-offA}
                    strokeLinecap="round"
                />
                <text y="6" textAnchor="middle" fontSize="14" fill="#0b1620" fontWeight={700}>
                    Expenditure
                </text>
                <text y="24" textAnchor="middle" fontSize="12" fill="#64748b">
                    Category
                </text>
            </g>
        </svg>
    );
}
