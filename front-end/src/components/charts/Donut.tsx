// src/components/charts/Donut.tsx

export type DonutProps = {
    valueA: number; // slice 1
    valueB: number; // slice 2
    valueC: number; // slice 3
    size?: number; // svg size (default 180)
    stroke?: number; // ring thickness (default 18)
    colors?: [string, string, string]; // [A,B,C]
    centerLabel?: { top?: string; bottom?: string };
};

function clampTotal(n: number) {
    return n <= 0 ? 0.0001 : n; // avoid NaN when all = 0
}

export function Donut({
    valueA,
    valueB,
    valueC,
    size = 180,
    stroke = 18,
    colors = ["#0f6b5f", "#9ec8be", "#cfe6e0"],
    centerLabel = { top: "Expenditure", bottom: "Category" },
}: DonutProps) {
    const total = clampTotal(valueA + valueB + valueC);
    const a = (valueA / total) * 100;
    const b = (valueB / total) * 100;
    const c = (valueC / total) * 100;

    // radius so the ring has a little margin inside the viewBox
    const R = size / 2 - stroke - 5;
    const C = 2 * Math.PI * R;

    const offA = 0;
    const offB = C * (a / 100);
    const offC = C * ((a + b) / 100);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-label="Donut chart" className="mx-auto">
            <g transform={`translate(${size / 2},${size / 2})`}>
                {/* track */}
                <circle r={R} fill="none" stroke="#eef2f5" strokeWidth={stroke} />

                {/* draw C then B then A so A is on top visually */}
                <circle
                    r={R}
                    fill="none"
                    stroke={colors[2]}
                    strokeWidth={stroke}
                    strokeDasharray={`${(C * c) / 100} ${C}`}
                    strokeDashoffset={-offC}
                    strokeLinecap="round"
                />
                <circle
                    r={R}
                    fill="none"
                    stroke={colors[1]}
                    strokeWidth={stroke}
                    strokeDasharray={`${(C * b) / 100} ${C}`}
                    strokeDashoffset={-offB}
                    strokeLinecap="round"
                />
                <circle
                    r={R}
                    fill="none"
                    stroke={colors[0]}
                    strokeWidth={stroke}
                    strokeDasharray={`${(C * a) / 100} ${C}`}
                    strokeDashoffset={-offA}
                    strokeLinecap="round"
                />

                {/* center label */}
                <text y={6} textAnchor="middle" fontSize={14} fill="#0b1620" fontWeight={700}>
                    {centerLabel.top ?? ""}
                </text>
                <text y={24} textAnchor="middle" fontSize={12} fill="#64748b">
                    {centerLabel.bottom ?? ""}
                </text>
            </g>
        </svg>
    );
}

export default Donut;
