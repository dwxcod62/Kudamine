// src/pages/InvestmentsPage.tsx
import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../components/Modal";
import { DesignTokens } from "../styles/DesignTokens";

/** ==== Types ==== */
type Position = {
    id: string;
    symbol: string;
    qty: number;
    buyPrice: number;
    targetUp?: number | null;
    targetDown?: number | null;
    notify?: boolean;
};

type Tick = { p: number; s: string; t: number }; // price, symbol, ts
type Settings = { notifyEnabled: boolean; bandPct: number; cooldownMs: number };

/** ==== Constants & Utils ==== */
const LS_POSITIONS = "invest.positions.v1";
const LS_SETTINGS = "invest.settings.v1";
const DEFAULT_SETTINGS: Settings = { notifyEnabled: true, bandPct: 0.001, cooldownMs: 15000 };

function uid() {
    return Math.random().toString(36).slice(2, 10);
}
function fmt(n: number, d = 2) {
    return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
function loadPositions(): Position[] {
    try {
        const raw = localStorage.getItem(LS_POSITIONS);
        return raw ? (JSON.parse(raw) as Position[]) : [];
    } catch {
        return [];
    }
}
function savePositions(positions: Position[]) {
    localStorage.setItem(LS_POSITIONS, JSON.stringify(positions));
}
function loadSettings(): Settings {
    try {
        const raw = localStorage.getItem(LS_SETTINGS);
        return raw ? (JSON.parse(raw) as Settings) : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

/** ==== Notification helper ==== */
function notify(message: string) {
    try {
        if (!("Notification" in window)) return console.log("[ALERT]", message);
        if (Notification.permission === "granted") new Notification(message);
        else if (Notification.permission !== "denied") Notification.requestPermission();
        console.log("[ALERT]", message);
    } catch {}
}

/** ==== usePrices: quản lý WS + giá theo nhiều symbol ==== */
function usePrices(symbols: string[], positions: Position[], settings: Settings) {
    const rawToken = import.meta.env.VITE_FINNHUB_TOKEN as string | undefined;
    const token = rawToken?.trim();
    const [prices, setPrices] = useState<Record<string, number>>({});
    const wsRef = useRef<WebSocket | null>(null);
    const prevSymbolsRef = useRef<string[]>([]);
    const lastAlertAt = useRef<Record<string, number>>({});
    const positionsRef = useRef(positions);
    const settingsRef = useRef(settings);
    const reconnectTimer = useRef<number | null>(null);
    const heartbeatRef = useRef<number | null>(null);
    const openingRef = useRef(false); // guard duplicate connect attempts
    const mountedRef = useRef(false); // avoid actions after unmount

    useEffect(() => {
        positionsRef.current = positions;
    }, [positions]);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    const sideKey = (sym: string, side: "up" | "down") => `${sym}:${side}`;

    const clearTimers = () => {
        if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
            heartbeatRef.current = null;
        }
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
    };

    const safeClose = (ws: WebSocket | null, code = 1000, reason = "cleanup") => {
        try {
            if (ws && ws.readyState === WebSocket.OPEN) ws.close(code, reason);
        } catch {}
    };

    const connect = useCallback(
        (attempt = 0) => {
            if (!mountedRef.current || !token) return;
            if (
                openingRef.current ||
                (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING))
            ) {
                return;
            }
            openingRef.current = true;

            const url = `wss://ws.finnhub.io?token=${encodeURIComponent(token)}`;
            console.log("[FINNHUB] opening", { tokenLen: token.length, url });

            const ws = new WebSocket(url);
            wsRef.current = ws;

            const safeSend = (obj: unknown) => {
                try {
                    ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(obj));
                } catch {}
            };

            ws.onopen = () => {
                console.log("[FINNHUB] open");
                openingRef.current = false;
                // keep-alive ping (Finnhub tolerates this)
                heartbeatRef.current = window.setInterval(() => {
                    try {
                        ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: "ping" }));
                    } catch {}
                }, 25_000);

                // subscribe current set
                prevSymbolsRef.current = symbols;
                symbols.forEach((s) => s && safeSend({ type: "subscribe", symbol: s }));
            };

            ws.onmessage = (e) => {
                const msg = JSON.parse(e.data);
                if (msg?.type !== "trade" || !Array.isArray(msg?.data)) return;
                const last: Tick = msg.data[msg.data.length - 1];
                if (!last?.s || typeof last.p !== "number") return;

                setPrices((prev) => (prev[last.s] === last.p ? prev : { ...prev, [last.s]: last.p }));

                const s = settingsRef.current;
                if (!s.notifyEnabled) return;
                const band = s.bandPct;
                const now = Date.now();
                for (const p of positionsRef.current) {
                    if (!p.notify || p.symbol !== last.s) continue;
                    if (p.targetUp && last.p >= p.targetUp * (1 + band)) {
                        const k = sideKey(p.symbol, "up");
                        if (!lastAlertAt.current[k] || now - lastAlertAt.current[k] > s.cooldownMs) {
                            lastAlertAt.current[k] = now;
                            notify(`${p.symbol} vượt mục tiêu ↑ ${fmt(p.targetUp)} → ${fmt(last.p)}`);
                        }
                    }
                    if (p.targetDown && last.p <= p.targetDown * (1 - band)) {
                        const k = sideKey(p.symbol, "down");
                        if (!lastAlertAt.current[k] || now - lastAlertAt.current[k] > s.cooldownMs) {
                            lastAlertAt.current[k] = now;
                            notify(`${p.symbol} thủng mục tiêu ↓ ${fmt(p.targetDown)} → ${fmt(last.p)}`);
                        }
                    }
                }
            };

            ws.onerror = (ev) => {
                console.warn("[FINNHUB] ws error", ev);
            };

            ws.onclose = (ev) => {
                console.warn(" [FINNHUB] closed", { code: ev.code, reason: ev.reason || "" });
                openingRef.current = false;
                clearTimers();
                wsRef.current = null;

                // Reconnect policy: retry on abnormal/network closes (1006/1001/etc.)
                if (!mountedRef.current) return;
                const retryable = ev.code === 1006 || ev.code === 1001 || ev.code === 1000; // 1000 when Fast Refresh/StrictMode cleans up
                if (retryable) {
                    const backoffMs = Math.min(30_000, 1000 * Math.pow(1.8, attempt)) + Math.floor(Math.random() * 400);
                    reconnectTimer.current = window.setTimeout(() => connect(attempt + 1), backoffMs);
                }
            };
        },
        [symbols, token]
    );

    useEffect(() => {
        mountedRef.current = true;
        if (!token) {
            console.warn("[FINNHUB] Missing VITE_FINNHUB_TOKEN; skipping WS.");
            return () => {
                mountedRef.current = false;
            };
        }
        connect(0);

        // Pause when tab hidden (optional, reduces server closes on background tabs)
        const onVis = () => {
            if (!mountedRef.current) return;
            const ws = wsRef.current;
            if (document.visibilityState === "visible") {
                // ensure connected
                if (!ws || ws.readyState !== WebSocket.OPEN) connect(0);
            }
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            mountedRef.current = false;
            document.removeEventListener("visibilitychange", onVis);
            clearTimers();
            // gracefully unsubscribe & close
            const ws = wsRef.current;
            try {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    prevSymbolsRef.current.forEach((s) => s && ws.send(JSON.stringify({ type: "unsubscribe", symbol: s })));
                }
            } catch {}
            safeClose(ws, 1000, "unmount");
            wsRef.current = null;
        };
    }, [connect, token]);

    // keep subs in sync on symbol changes without new socket
    useEffect(() => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            prevSymbolsRef.current = symbols;
            return;
        }
        const prev = new Set(prevSymbolsRef.current);
        const next = new Set(symbols);
        for (const s of prev) if (!next.has(s)) ws.send(JSON.stringify({ type: "unsubscribe", symbol: s }));
        for (const s of next) if (!prev.has(s)) ws.send(JSON.stringify({ type: "subscribe", symbol: s }));
        prevSymbolsRef.current = symbols;
    }, [symbols]);

    return prices;
}

/** ==== Theme toggle ==== */
// function ThemeToggle() {
//     const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
//     return (
//         <button
//             className="btn-ghost"
//             onClick={() => {
//                 const el = document.documentElement;
//                 el.classList.toggle("dark");
//                 setIsDark(el.classList.contains("dark"));
//                 localStorage.setItem("prefers.dark", el.classList.contains("dark") ? "1" : "0");
//             }}
//             title="Toggle theme"
//         >
//             {isDark ? "Light" : "Dark"}
//         </button>
//     );
// }
// Khởi tạo theme theo lưu trữ
(function initThemeOnce() {
    try {
        const v = localStorage.getItem("prefers.dark");
        if (v === "1") document.documentElement.classList.add("dark");
    } catch {}
})();

/** ==== Main Page ==== */
export default function InvestmentsPage() {
    // ✅ positions là mảng
    const [positions, setPositions] = useState<Position[]>(() => loadPositions());
    const [settings] = useState<Settings>(() => loadSettings());

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    useEffect(() => savePositions(positions), [positions]);

    const symbols = useMemo(() => Array.from(new Set(positions.map((p) => p.symbol).filter(Boolean))).sort(), [positions]);
    // const prices = usePriceFeed(symbols);
    const prices = usePrices(symbols, positions, settings);

    const { invested, marketValue, pnl } = useMemo(() => {
        let invested = 0;
        let market = 0;
        for (const p of positions) {
            invested += p.buyPrice * p.qty;
            market += (prices[p.symbol] ?? p.buyPrice) * p.qty;
        }
        return { invested, marketValue: market, pnl: market - invested };
    }, [positions, prices]);

    const addPos = useCallback((draft: Omit<Position, "id">) => {
        setPositions((ps) => [{ ...draft, id: uid() }, ...ps]);
    }, []);
    const removePos = useCallback((id: string) => {
        setPositions((ps) => ps.filter((x) => x.id !== id));
    }, []);
    const patchPos = useCallback((id: string, patch: Partial<Position>) => {
        setPositions((ps) => ps.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    }, []);

    // ==== Add Modal ====
    const [openAdd, setOpenAdd] = useState(false);
    const [draft, setDraft] = useState<Omit<Position, "id">>({
        symbol: "AAPL",
        qty: 1,
        buyPrice: 100,
        targetUp: null,
        targetDown: null,
        notify: true,
    });

    const statusOf = (p: Position) => {
        const cur = prices[p.symbol];
        if (cur == null) return "Waiting";
        const change = cur - p.buyPrice;
        if (p.targetUp && cur >= p.targetUp) return "Target ↑ hit";
        if (p.targetDown && cur <= p.targetDown) return "Target ↓ hit";
        return change >= 0 ? "Up" : "Down";
    };

    return (
        <>
            <DesignTokens />

            <div className="p-6 space-y-6">
                {/* Header actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Investments overview</h1>
                        <p className="tag">Theo dõi danh mục & cảnh báo chạm giá</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* <ThemeToggle /> */}
                        <button className="btn" onClick={() => setOpenAdd(true)}>
                            Add position
                        </button>
                        <button className="btn-ghost" onClick={() => setPositions([])}>
                            Clear all
                        </button>
                    </div>
                </div>

                {/* KPI cards (better layout) */}
                <div className="kpi-grid">
                    <KpiCard title="Total invested" value={`$${fmt(invested)}`} subtitle="Sum of buy costs" />

                    <KpiCard title="Market value" value={`$${fmt(marketValue)}`} subtitle="Using latest prices" />

                    <KpiCard
                        title="Unrealized P/L"
                        value={`${pnl >= 0 ? "+" : "-"}$${fmt(Math.abs(pnl))}`}
                        subtitle={(() => {
                            const pct = invested > 0 ? ((marketValue - invested) / invested) * 100 : 0;
                            const sign = pct >= 0 ? "+" : "";
                            return `${sign}${fmt(pct, 2)}%`;
                        })()}
                        tone={pnl === 0 ? "muted" : pnl > 0 ? "positive" : "negative"}
                    />
                </div>

                {/* Table */}
                <div className="box" style={{ overflow: "hidden" }}>
                    <div
                        style={{
                            padding: ".9rem .95rem",
                            borderBottom: `1px solid var(--border)`,
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{ fontWeight: 600 }}>Portfolio</div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Qty</th>
                                    <th>Buy</th>
                                    <th>Price</th>
                                    <th>P/L</th>
                                    <th>Target ↑</th>
                                    <th>Target ↓</th>
                                    <th>Status</th>
                                    <th>Notify</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions.length === 0 && (
                                    <tr>
                                        <td colSpan={10} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                                            No positions yet. Add one above.
                                        </td>
                                    </tr>
                                )}
                                {positions.map((p) => {
                                    const price = prices[p.symbol];
                                    const cur = price ?? p.buyPrice;
                                    const pnlUnit = cur - p.buyPrice;
                                    const pnl = pnlUnit * p.qty;
                                    const status = statusOf(p);

                                    const pill = (() => {
                                        if (status.includes("Target"))
                                            return { bg: "var(--warn-soft, rgba(251,191,36,.18))", fg: "var(--warn, #d97706)" };
                                        if (status === "Up") return { bg: "var(--ok-soft, rgba(52,211,153,.18))", fg: "var(--ok, #059669)" };
                                        if (status === "Down") return { bg: "var(--bad-soft, rgba(248,113,113,.18))", fg: "var(--bad, #dc2626)" };
                                        return { bg: "var(--surface-2)", fg: "var(--muted)" };
                                    })();

                                    return (
                                        <tr key={p.id} style={{ borderTop: `1px solid var(--border)` }}>
                                            <td>{p.symbol}</td>
                                            <td>{fmt(p.qty, 0)}</td>
                                            <td>${fmt(p.buyPrice)}</td>
                                            <td>{price != null ? `$${fmt(price)}` : "—"}</td>
                                            <td>
                                                <span style={{ color: pnl >= 0 ? "var(--ok, #059669)" : "var(--bad, #dc2626)", fontWeight: 600 }}>
                                                    {pnl >= 0 ? "+" : "-"}${fmt(Math.abs(pnl))}
                                                </span>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    style={{ width: "7.5rem" }}
                                                    value={p.targetUp ?? ""}
                                                    onChange={(e) =>
                                                        patchPos(p.id, { targetUp: e.target.value === "" ? null : Number(e.target.value) })
                                                    }
                                                    step="0.01"
                                                    placeholder="—"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input"
                                                    style={{ width: "7.5rem" }}
                                                    value={p.targetDown ?? ""}
                                                    onChange={(e) =>
                                                        patchPos(p.id, { targetDown: e.target.value === "" ? null : Number(e.target.value) })
                                                    }
                                                    step="0.01"
                                                    placeholder="—"
                                                />
                                            </td>
                                            <td>
                                                <span className="chip" style={{ background: pill.bg, color: pill.fg, fontWeight: 700 }}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => patchPos(p.id, { notify: !p.notify })}
                                                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                                        p.notify
                                                            ? "bg-emerald-500 border-emerald-600 text-white"
                                                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent"
                                                    }`}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <button className="btn-ghost" onClick={() => removePos(p.id)}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer hint */}
                <p className="tag">* Dữ liệu realtime qua Finnhub WS (free tier có thể có độ trễ & giới hạn symbol).</p>
            </div>

            {/* Local input styles theo tokens */}
            <style>{`
                .input{
                width:100%;
                border:1px solid var(--border);
                border-radius:12px;
                padding:.55rem .7rem;
                background:var(--surface);
                color:var(--text);
                outline:none;
                transition: box-shadow .15s ease, border-color .15s ease;
                }
                .input:focus{
                box-shadow:0 0 0 3px color-mix(in srgb, var(--btn-bg) 20%, transparent);
                border-color: color-mix(in srgb, var(--btn-bg) 38%, var(--border));
                }
                /* --- KPI layout --- */
                .kpi-grid{
                    display:grid;
                    gap:1rem;
                    grid-template-columns: repeat( auto-fit, minmax(220px, 1fr) );
                }
                .kpi-card{
                    border:1px solid var(--border);
                    background:var(--surface);
                    border-radius:16px;
                    padding:1rem;
                    box-shadow: var(--elev-thin, 0 1px 4px rgba(2,8,23,.05));
                    display:flex;
                    flex-direction:column;
                    min-height:118px;
                }
                .kpi-head{
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    margin-bottom:.35rem;
                }
                .kpi-title{
                    font-size:.85rem;
                    font-weight:600;
                    color:var(--muted);
                }
                .kpi-val{
                    font-size:1.55rem;
                    line-height:1.1;
                    font-weight:800;
                    letter-spacing:-0.01em;
                    color:var(--text);
                }
                .kpi-sub{
                    margin-top:.35rem;
                    font-size:.8rem;
                    color:var(--muted);
                }

                /* --- tones --- */
                .kpi-tone-positive .kpi-val{ color: var(--ok, #059669); }
                .kpi-tone-negative .kpi-val{ color: var(--bad, #dc2626); }
                .kpi-tone-muted .kpi-val{ color: var(--muted); }
      `}</style>

            {/* Add Position Modal */}
            <Modal
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                title="Add position"
                widthClass="max-w-xl"
                footer={
                    <>
                        <button className="btn-ghost" onClick={() => setOpenAdd(false)}>
                            Cancel
                        </button>
                        <button
                            className="btn"
                            onClick={() => {
                                if (!draft.symbol || !draft.qty || !draft.buyPrice) return;
                                addPos({ ...draft, symbol: draft.symbol.toUpperCase().trim() });
                                setOpenAdd(false);
                                setDraft((d) => ({ ...d, qty: 1 })); // giữ symbol/buyPrice cho lần tới
                            }}
                        >
                            Save
                        </button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Symbol">
                        <input
                            className="input"
                            value={draft.symbol}
                            onChange={(e) => setDraft((d) => ({ ...d, symbol: e.target.value.toUpperCase().trim() }))}
                            placeholder="AAPL"
                        />
                    </Field>
                    <Field label="Qty">
                        <input
                            type="number"
                            className="input"
                            value={draft.qty}
                            onChange={(e) => setDraft((d) => ({ ...d, qty: Number(e.target.value || 0) }))}
                            min={0}
                            step="1"
                        />
                    </Field>
                    <Field label="Buy price ($)">
                        <input
                            type="number"
                            className="input"
                            value={draft.buyPrice}
                            onChange={(e) => setDraft((d) => ({ ...d, buyPrice: Number(e.target.value || 0) }))}
                            min={0}
                            step="0.01"
                        />
                    </Field>
                    <Field label="Target ↑ ($)">
                        <input
                            type="number"
                            className="input"
                            value={draft.targetUp ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, targetUp: e.target.value === "" ? null : Number(e.target.value) }))}
                            step="0.01"
                            placeholder="optional"
                        />
                    </Field>
                    <Field label="Target ↓ ($)">
                        <input
                            type="number"
                            className="input"
                            value={draft.targetDown ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, targetDown: e.target.value === "" ? null : Number(e.target.value) }))}
                            step="0.01"
                            placeholder="optional"
                        />
                    </Field>
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <button
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, notify: !d.notify }))}
                            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                                draft.notify
                                    ? "bg-emerald-500 border-emerald-600 text-white"
                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-transparent"
                            }`}
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <span className="tag">Notify</span>
                    </label>
                </div>
            </Modal>
        </>
    );
}

/** ==== Small UI helpers ==== */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="text-sm" style={{ display: "flex", flexDirection: "column", gap: ".35rem" }}>
            <div style={{ color: "var(--muted)" }}>{label}</div>
            {children}
        </label>
    );
}

function KpiCard({
    title,
    value,
    subtitle,
    tone = "default",
}: {
    title: string;
    value: string | React.ReactNode;
    subtitle?: string | React.ReactNode;
    tone?: "default" | "positive" | "negative" | "muted";
}) {
    const toneClass =
        tone === "positive"
            ? "kpi-tone-positive"
            : tone === "negative"
            ? "kpi-tone-negative"
            : tone === "muted"
            ? "kpi-tone-muted"
            : "kpi-tone-default";

    return (
        <div className={`kpi-card ${toneClass}`}>
            <div className="kpi-head">
                <div className="kpi-title">{title}</div>
            </div>
            <div className="kpi-val">{value}</div>
            {subtitle ? <div className="kpi-sub">{subtitle}</div> : null}
        </div>
    );
}
