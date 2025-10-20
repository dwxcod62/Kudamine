// src/hooks/useSidebar.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSidebar, updateSidebar, type SidebarItem, type UpdatePrefsBody } from "../../lib/navbarApi";
import { useAuthStore } from "../../stores/auth";

export type UseSidebarOptions = {
    groupBy?: boolean; // true: group theo 'group'
};

type Grouped = [string, SidebarItem[]][];

export function useSidebar(opts?: UseSidebarOptions) {
    const { groupBy = true } = opts ?? {};
    const user = useAuthStore((s) => s.user);
    const userId = user?.id ?? "demo-user";

    console.log(user?.id ?? "a");

    const [items, setItems] = useState<SidebarItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<unknown>(null);

    const abortRef = useRef<AbortController | null>(null);

    const fetchSidebar = useCallback(async () => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setLoading(true);
        setError(null);

        try {
            const data = await getSidebar({
                userId,
                signal: ctrl.signal,
            });
            setItems(data);
        } catch (e: any) {
            if (e?.name === "AbortError" || e?.code === 20) {
                return;
            }
            setError(e);
            setItems([]);
        } finally {
            if (!ctrl.signal.aborted) setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchSidebar();
        return () => abortRef.current?.abort();
    }, [fetchSidebar]);

    const savePrefs = useCallback(
        async (body: UpdatePrefsBody) => {
            // optimistic
            setItems((prev): SidebarItem[] => {
                let next = [...prev];
                if (body.enabledKeys) {
                    const set = new Set(body.enabledKeys);
                    next = next.filter((it) => set.has(it.key));
                }
                if (body.orderedKeys) {
                    const idx = new Map(body.orderedKeys.map((k, i) => [k, i]));
                    next = next
                        .map((it) => ({
                            ...it,
                            position: idx.get(it.key) ?? it.position ?? 0,
                        }))
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                }
                return next;
            });

            await updateSidebar(body, { userId });
            fetchSidebar();
        },
        [userId, fetchSidebar]
    );

    const grouped = useMemo<Grouped | null>(() => {
        if (!groupBy) return null;
        const groups = new Map<string, SidebarItem[]>();
        for (const it of items) {
            const g = (it.group ?? "Main").trim();
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g)!.push(it);
        }
        for (const arr of groups.values()) {
            arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        }
        return Array.from(groups.entries()).sort(([ga], [gb]) => ga.localeCompare(gb));
    }, [items, groupBy]);

    return {
        items,
        grouped,
        loading,
        error,
        refetch: fetchSidebar,
        savePrefs,
        userId,
    };
}
