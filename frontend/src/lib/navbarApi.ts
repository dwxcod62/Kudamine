// src/api/navbarApi.ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export type SidebarItem = {
    key: string;
    label: string;
    path: string;
    iconKey?: string | null;
    group?: string | null;
    position?: number | null;
    pinned?: boolean | null;
};

export type UpdatePrefsBody = {
    /** Các key đang bật (enabled) sau khi user tùy chỉnh */
    enabledKeys?: string[];
    /** Thứ tự key sau khi user sắp xếp (0..n) */
    orderedKeys?: string[];
    /** Các key được pin */
    pinnedKeys?: string[];
};

/** Bổ sung kiểu cho NavItem CRUD (admin) */
export type NavItem = {
    key: string;
    label: string;
    path: string;
    iconKey: string | null;
    group: string | null;
    position: number | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
};
export type NavItemCreate = {
    key: string;
    label: string;
    path: string;
    iconKey?: string | null;
    group?: string | null;
    position?: number | null;
    isActive?: boolean;
};
export type NavItemUpdate = Partial<Omit<NavItemCreate, "key">> & {
    isActive?: boolean;
};

/** Bổ sung kiểu cho bản ghi prefs thô của user */
export type UserNavItemPref = {
    userId: string;
    navKey: string;
    enabled: boolean; // schema của bạn là Boolean (không null)
    position: number | null;
    pinned: boolean; // schema của bạn là Boolean (không null)
    createdAt?: string;
    updatedAt?: string;
};

/* =========================
 *  Sidebar (merged)
 * ========================= */
export async function getSidebar(opts?: {
    userId?: string; // dev/test khi chưa có auth
    signal?: AbortSignal;
}): Promise<SidebarItem[]> {
    const q = opts?.userId ? `?userId=${encodeURIComponent(opts.userId)}` : "";
    const res = await fetch(`${API_BASE}/navbar/sidebar${q}`, { signal: opts?.signal });
    if (!res.ok) throw new Error(`getSidebar: HTTP ${res.status}`);
    return (await res.json()) as SidebarItem[];
}

export async function updateSidebar(body: UpdatePrefsBody, opts?: { userId?: string; signal?: AbortSignal }): Promise<{ ok: true }> {
    const q = opts?.userId ? `?userId=${encodeURIComponent(opts.userId)}` : "";
    const res = await fetch(`${API_BASE}/navbar/sidebar${q}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: opts?.signal,
    });
    if (!res.ok) throw new Error(`updateSidebar: HTTP ${res.status}`);
    return res.json();
}

/* =========================
 *  User prefs (raw)
 *  /navbar/users/:userId/prefs
 * ========================= */
export async function getUserPrefs(userId: string, opts?: { signal?: AbortSignal }): Promise<UserNavItemPref[]> {
    const res = await fetch(`${API_BASE}/navbar/users/${encodeURIComponent(userId)}/prefs`, {
        signal: opts?.signal,
    });
    if (!res.ok) throw new Error(`getUserPrefs: HTTP ${res.status}`);
    return res.json();
}

export async function putUserPrefs(userId: string, body: UpdatePrefsBody, opts?: { signal?: AbortSignal }): Promise<{ ok: true }> {
    const res = await fetch(`${API_BASE}/navbar/users/${encodeURIComponent(userId)}/prefs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: opts?.signal,
    });
    if (!res.ok) throw new Error(`putUserPrefs: HTTP ${res.status}`);
    return res.json();
}

export type UserSidebarItem = {
    key: string;
    label: string;
    path: string;
    iconKey: string | null;
    group: string | null;
    position: number;
    pinned: boolean;
    enabled: boolean;
    isActive: boolean;
};

// --- thêm hàm gọi endpoint GET /navbar/users/{userId}/sidebar ---
export async function getUserSidebar(
    userId: string,
    opts?: { includeDisabled?: boolean; includeInactive?: boolean; signal?: AbortSignal }
): Promise<UserSidebarItem[]> {
    const q = new URLSearchParams();
    if (opts?.includeDisabled) q.set("includeDisabled", "true");
    if (opts?.includeInactive) q.set("includeInactive", "true");
    const qs = q.toString() ? `?${q.toString()}` : "";

    const res = await fetch(`${API_BASE}/navbar/users/${encodeURIComponent(userId)}/sidebar${qs}`, {
        signal: opts?.signal,
    });
    if (!res.ok) throw new Error(`getUserSidebar: HTTP ${res.status}`);
    return res.json();
}

/* =========================
 *  NavItem catalog (admin)
 * ========================= */
export async function listNavItems(active?: boolean): Promise<NavItem[]> {
    const q = active == null ? "" : `?active=${active ? "true" : "false"}`;
    const res = await fetch(`${API_BASE}/navbar/items${q}`);
    if (!res.ok) throw new Error(`listNavItems: HTTP ${res.status}`);
    return res.json();
}

export async function getNavItem(key: string): Promise<NavItem> {
    const res = await fetch(`${API_BASE}/navbar/items/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`getNavItem: HTTP ${res.status}`);
    return res.json();
}

export async function createNavItem(data: NavItemCreate): Promise<NavItem> {
    const res = await fetch(`${API_BASE}/navbar/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`createNavItem: HTTP ${res.status}`);
    return res.json();
}

export async function patchNavItem(key: string, data: NavItemUpdate): Promise<NavItem> {
    const res = await fetch(`${API_BASE}/navbar/items/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`patchNavItem: HTTP ${res.status}`);
    return res.json();
}

export async function deleteNavItem(key: string): Promise<void> {
    const res = await fetch(`${API_BASE}/navbar/items/${encodeURIComponent(key)}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(`deleteNavItem: HTTP ${res.status}`);
    // 204 No Content
}
