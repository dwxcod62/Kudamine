// src/hooks/useUserSidebar.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getUserSidebar, type UserSidebarItem } from "../../lib/navbarApi"; // chỉnh path cho đúng
import { useAuthStore } from "../../stores/auth";

export type UseUserSidebarOptions = {
    userId?: string;
    includeDisabled?: boolean;
    includeInactive?: boolean;
    groupBy?: boolean;
    pinnedFirst?: boolean;
};

type Grouped = [string, UserSidebarItem[]][];

export function useUserSidebar(opts?: UseUserSidebarOptions) {
    const { userId: userIdProp, includeDisabled = false, includeInactive = false, groupBy = true, pinnedFirst = true } = opts ?? {};

    const authUser = useAuthStore((s) => s.user);
    const userId = userIdProp ?? authUser?.id ?? "demo-user";

    const [items, setItems] = useState<UserSidebarItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null);

    const abortRef = useRef<AbortController | null>(null);
    const requestSeq = useRef(0);

    const applySort = useCallback(
        (arr: UserSidebarItem[]) => {
            let next = [...arr];
            if (pinnedFirst) next.sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
            next = next.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            return next;
        },
        [pinnedFirst]
    );

    const fetchSidebar = useCallback(async () => {
        if (!userId) return;
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setLoading(true);
        setError(null);
        const seq = ++requestSeq.current;

        try {
            const data = await getUserSidebar(userId, {
                includeDisabled,
                includeInactive,
                signal: ctrl.signal,
            });
            if (seq !== requestSeq.current) return;
            setItems(applySort(data));
        } catch (e: any) {
            if (e?.name !== "AbortError" && e?.code !== 20) setError(e);
            if (seq === requestSeq.current) setItems([]);
        } finally {
            if (!ctrl.signal.aborted && seq === requestSeq.current) setLoading(false);
        }
    }, [userId, includeDisabled, includeInactive, applySort]);

    useEffect(() => {
        fetchSidebar();
        return () => abortRef.current?.abort();
    }, [fetchSidebar]);

    // group theo group field
    const grouped = useMemo<Grouped | null>(() => {
        if (!groupBy) return null;
        const groups = new Map<string, UserSidebarItem[]>();
        for (const it of items) {
            const g = (it.group ?? "Main").trim();
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g)!.push(it);
        }
        for (const arr of groups.values()) {
            arr.sort((a, b) => {
                if (pinnedFirst && !!b.pinned !== !!a.pinned) {
                    return Number(!!b.pinned) - Number(!!a.pinned);
                }
                return (a.position ?? 0) - (b.position ?? 0);
            });
        }
        return Array.from(groups.entries()).sort(([ga], [gb]) => ga.localeCompare(gb));
    }, [items, groupBy, pinnedFirst]);

    return {
        items,
        grouped,
        loading,
        error,
        refetch: fetchSidebar,
        userId,
    };
}
