// src/services/priceFeed.ts
type Tick = { p: number; s: string; t: number };

type Listener = (tick: Tick) => void;

class PriceFeed {
    private ws: WebSocket | null = null;
    private token: string;
    private isOpen = false;

    // ai đang cần symbol nào (ref-count)
    private wants = new Map<string, number>();
    // giá mới nhất cho mỗi symbol
    private latest = new Map<string, number>();
    // tất cả listener (mỗi listener có thể nghe nhiều symbol, tự lọc bên ngoài)
    private listeners = new Set<Listener>();

    constructor(token: string) {
        this.token = token;
        if (token) this.connect();
        // đóng WS khi đóng tab
        window.addEventListener("beforeunload", () => this.safeClose());
    }

    private connect() {
        if (!this.token || this.ws) return;
        this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.token}`);

        this.ws.onopen = () => {
            this.isOpen = true;
            // subscribe lại tất cả symbol đang cần
            for (const sym of this.wants.keys()) {
                this.send({ type: "subscribe", symbol: sym });
            }
        };

        this.ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg?.type !== "trade" || !Array.isArray(msg?.data)) return;
                const last: Tick = msg.data[msg.data.length - 1];
                if (!last?.s || typeof last.p !== "number") return;

                // lưu snapshot
                this.latest.set(last.s, last.p);
                // bắn cho tất cả listeners
                for (const fn of this.listeners) fn(last);
            } catch {}
        };

        this.ws.onclose = () => {
            this.isOpen = false;
            this.ws = null;
            // auto-retry nhẹ sau 1.5s
            setTimeout(() => this.connect(), 1500);
        };

        this.ws.onerror = () => {
            try {
                this.ws?.close();
            } catch {}
        };
    }

    private send(obj: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify(obj));
    }

    /** tăng ref-count cho symbol và subscribe nếu cần */
    addSymbols(symbols: string[]) {
        for (const s of symbols) {
            if (!s) continue;
            const cur = this.wants.get(s) ?? 0;
            this.wants.set(s, cur + 1);
            if (cur === 0 && this.isOpen) this.send({ type: "subscribe", symbol: s });
        }
    }

    /** giảm ref-count cho symbol và unsubscribe nếu về 0 */
    removeSymbols(symbols: string[]) {
        for (const s of symbols) {
            if (!s) continue;
            const cur = this.wants.get(s) ?? 0;
            if (cur <= 1) {
                this.wants.delete(s);
                if (this.isOpen) this.send({ type: "unsubscribe", symbol: s });
            } else {
                this.wants.set(s, cur - 1);
            }
        }
    }

    /** lấy snapshot giá hiện có (không đợi server) */
    snapshot(symbols: string[]) {
        const out: Record<string, number> = {};
        for (const s of symbols) {
            const v = this.latest.get(s);
            if (typeof v === "number") out[s] = v;
        }
        return out;
    }

    /** subscribe tick stream (mọi symbol); tự lọc bên ngoài nếu muốn */
    onTick = (fn: Listener) => {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    };

    /** đóng WS hoàn toàn (ít dùng) */
    safeClose() {
        try {
            this.ws?.close();
        } catch {}
        this.ws = null;
        this.isOpen = false;
    }
}

// Singleton export
let _feed: PriceFeed | null = null;
export function getPriceFeed() {
    const token = import.meta.env.VITE_FINNHUB_TOKEN as string;
    if (!_feed) _feed = new PriceFeed(token);
    return _feed;
}
