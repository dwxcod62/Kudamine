import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, init: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : init;
        } catch {
            return init;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {}
    }, [key, state]);

    return [state, setState] as const;
}
