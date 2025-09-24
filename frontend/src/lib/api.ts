// src/lib/api.ts
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(API + url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}: ${msg}`);
    }
    return res.json() as Promise<T>;
}

export const api = {
    // playlists
    listPlaylistsByUser: (userId: string) => http<any[]>(`/playlists?userId=${encodeURIComponent(userId)}`),

    getPlaylist: (id: string) => http<{ id: string; title: string; coverUrl?: string; tracks: any[] }>(`/playlists/${id}`),

    createPlaylist: (payload: { userId: string; title: string; coverUrl?: string }) =>
        http(`/playlists`, { method: "POST", body: JSON.stringify(payload) }),

    updatePlaylist: (id: string, payload: { title?: string; coverUrl?: string }) =>
        http(`/playlists/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

    deletePlaylist: (id: string) => http<{ ok: true }>(`/playlists/${id}`, { method: "DELETE" }),

    // tracks
    listTracks: (playlistId: string) => http<any[]>(`/playlists/${playlistId}/tracks`),

    addTracks: (playlistId: string, items: any[]) => http(`/playlists/${playlistId}/tracks`, { method: "POST", body: JSON.stringify({ items }) }),

    updateTrack: (id: string, payload: any) => http(`/tracks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

    deleteTrack: (id: string) => http<{ ok: true }>(`/tracks/${id}`, { method: "DELETE" }),

    reorderTracks: (playlistId: string, orders: { id: string; position: number }[]) =>
        http(`/playlists/${playlistId}/tracks/reorder`, { method: "POST", body: JSON.stringify({ orders }) }),
};
