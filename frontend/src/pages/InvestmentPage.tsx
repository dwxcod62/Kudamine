// src/pages/InvestmentsPage.tsx
import { useEffect, useRef, useState } from "react";

type Tick = { p: number; s: string; t: number };

function usePriceAlert({
    symbol,
    target,
    bandPct = 0.001, // 0.1% hysteresis
    cooldownMs = 15_000, // 15s giữa các cảnh báo
    token,
}: {
    symbol: string;
    target: number;
    bandPct?: number;
    cooldownMs?: number;
    token: string;
}) {
    const [price, setPrice] = useState<number | null>(null);
    const lastAlertAt = useRef<number>(0);
    const alertedSide = useRef<"up" | "down" | null>(null);

    useEffect(() => {
        if (!symbol || !target) return;
        const ws = new WebSocket(`wss://ws.finnhub.io?token=${token}`);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: "subscribe", symbol }));
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (!data?.data) return;
            const tick: Tick = data.data[data.data.length - 1];
            if (!tick?.p) return;

            setPrice(tick.p);

            const upper = target * (1 + bandPct);
            const lower = target * (1 - bandPct);
            const now = Date.now();

            if (tick.p >= upper && (alertedSide.current !== "up" || now - lastAlertAt.current > cooldownMs)) {
                lastAlertAt.current = now;
                alertedSide.current = "up";
                notify(`${symbol} vượt ${target.toFixed(2)} → ${tick.p.toFixed(2)}`);
            }

            if (tick.p <= lower && (alertedSide.current !== "down" || now - lastAlertAt.current > cooldownMs)) {
                lastAlertAt.current = now;
                alertedSide.current = "down";
                notify(`${symbol} thủng ${target.toFixed(2)} → ${tick.p.toFixed(2)}`);
            }
        };

        return () => ws.close();
    }, [symbol, target, bandPct, cooldownMs, token]);

    return { price };
}

function notify(message: string) {
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification(message);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
    console.log("[ALERT]", message);
}

export default function InvestmentsPage() {
    const [symbol, setSymbol] = useState("BBAI");
    const [target, setTarget] = useState(230);
    const [band, setBand] = useState(0.001);
    const token = import.meta.env.VITE_FINNHUB_TOKEN as string;

    const { price } = usePriceAlert({ symbol, target, bandPct: band, token });

    return (
        <div className="p-6 max-w-md mx-auto space-y-4">
            <h1 className="text-xl font-bold">Investments Alert</h1>

            <label className="block">
                <span className="text-sm">Symbol</span>
                <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full border rounded px-2 py-1"
                    placeholder="BBAI"
                />
            </label>

            <label className="block">
                <span className="text-sm">Target Price</span>
                <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(parseFloat(e.target.value))}
                    className="w-full border rounded px-2 py-1"
                />
            </label>

            <label className="block">
                <span className="text-sm">Hysteresis Band (%)</span>
                <input
                    type="number"
                    step="0.01"
                    value={band * 100}
                    onChange={(e) => setBand(parseFloat(e.target.value) / 100)}
                    className="w-full border rounded px-2 py-1"
                />
            </label>

            <div className="p-3 border rounded bg-gray-50">
                <p>
                    Current price ({symbol}): <span className="font-semibold">{price ? price.toFixed(2) : "—"}</span>
                </p>
                <p>
                    Target: <span className="font-semibold">{target.toFixed(2)}</span>
                </p>
            </div>
        </div>
    );
}
