// src/hooks/usePriceFeed.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { getPriceFeed } from "../services/priceFeed";

export function usePriceFeed(symbols: string[]) {
    const feed = getPriceFeed();
    const wanted = useMemo(() => Array.from(new Set(symbols.filter(Boolean))).sort(), [symbols]);

    const [prices, setPrices] = useState<Record<string, number>>(() => feed.snapshot(wanted));
    const wantedRef = useRef<string[]>(wanted);

    useEffect(() => {
        // đăng ký symbol đang cần (ref-count + subscribe nếu lần đầu)
        feed.addSymbols(wanted);
        // init snapshot tức thì (không phải chờ WS)
        setPrices((prev) => ({ ...feed.snapshot(wanted), ...prev }));

        const off = feed.onTick((tick) => {
            if (!wantedRef.current.includes(tick.s)) return;
            setPrices((prev) => (prev[tick.s] === tick.p ? prev : { ...prev, [tick.s]: tick.p }));
        });

        return () => {
            off();
            // giảm ref-count và unsubscribe nếu không còn ai dùng
            feed.removeSymbols(wanted);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feed, wanted.join("|")]);

    useEffect(() => {
        wantedRef.current = wanted;
    }, [wanted]);

    return prices;
}
