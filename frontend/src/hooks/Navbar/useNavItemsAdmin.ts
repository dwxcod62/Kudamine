// src/hooks/useNavItemsAdmin.ts
import { useCallback, useEffect, useRef, useState } from "react";
import {
    createNavItem,
    deleteNavItem,
    getNavItem,
    listNavItems,
    patchNavItem,
    type NavItem,
    type NavItemCreate,
    type NavItemUpdate,
} from "../../lib/navbarApi";

export function useNavItemsAdmin(active?: boolean) {
    const [items, setItems] = useState<NavItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>(null);
    const abortRef = useRef<AbortController | null>(null);

    const refetch = useCallback(async () => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        setError(null);
        try {
            const data = await listNavItems(active);
            setItems(data);
        } catch (e: any) {
            setError(e);
            setItems([]);
        } finally {
            if (!ctrl.signal.aborted) setLoading(false);
        }
    }, [active]);

    useEffect(() => {
        refetch();
        return () => abortRef.current?.abort();
    }, [refetch]);

    const getOne = useCallback((key: string) => getNavItem(key), []);
    const createOne = useCallback(
        async (data: NavItemCreate) => {
            const created = await createNavItem(data);
            await refetch();
            return created;
        },
        [refetch]
    );

    const updateOne = useCallback(
        async (key: string, data: NavItemUpdate) => {
            const updated = await patchNavItem(key, data);
            await refetch();
            return updated;
        },
        [refetch]
    );

    const removeOne = useCallback(
        async (key: string) => {
            await deleteNavItem(key);
            await refetch();
        },
        [refetch]
    );

    return { items, loading, error, refetch, getOne, createOne, updateOne, removeOne };
}
