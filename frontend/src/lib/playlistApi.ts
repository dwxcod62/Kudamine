import { del, get, patch, post } from "./http";

// ---- server types (khớp Prisma/Express) ----
export type SrvPlaylist = {
    id: string;
    userId: string;
    title: string;
    coverUrl?: string | null;
    createdAt: string;
    updatedAt: string;
    tracks?: SrvTrack[];
};
export type SrvTrack = {
    id: string;
    playlistId: string;
    title: string;
    artist?: string | null;
    youtubeId: string;
    coverUrl?: string | null;
    liked?: boolean | null;
    durationS?: number | null;
    position?: number | null;
    createdAt: string;
    updatedAt: string;
};

// ---- endpoints ----
export const listPlaylists = (userId: string) => get<SrvPlaylist[]>(`/playlists?userId=${encodeURIComponent(userId)}`);
export const createPlaylist = (userId: string, title: string, coverUrl?: string) => post<SrvPlaylist>("/playlists", { userId, title, coverUrl });

export const getPlaylist = (id: string) => get<SrvPlaylist>(`/playlists/${id}`);
export const updatePlaylist = (id: string, body: { title?: string; coverUrl?: string | null }) => patch<SrvPlaylist>(`/playlists/${id}`, body);
export const removePlaylist = (id: string) => del<{ ok: true }>(`/playlists/${id}`);

export const listTracks = (playlistId: string) => get<SrvTrack[]>(`/playlists/${playlistId}/tracks`);
export const addTracks = (
    playlistId: string,
    items: { title: string; artist?: string; youtubeId: string; coverUrl?: string; durationS?: number; position?: number }[]
) => post<SrvTrack[]>(`/playlists/${playlistId}/tracks`, { items });

export const updateTrack = (id: string, body: Partial<Omit<SrvTrack, "id" | "playlistId" | "createdAt" | "updatedAt">>) =>
    patch<SrvTrack>(`/tracks/${id}`, body);
export const removeTrack = (id: string) => del<{ ok: true }>(`/tracks/${id}`);

export const reorderTracks = (playlistId: string, orders: { id: string; position: number }[]) =>
    post<{ ok: true }>(`/playlists/${playlistId}/tracks/reorder`, { orders });

export async function apiUpdatePlaylistMultipart(id: string, file: File, title?: string) {
    const form = new FormData();
    form.append("cover", file);
    if (title) form.append("title", title);

    const res = await fetch(`/playlists/${id}`, { method: "PATCH", body: form });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Update failed: ${res.status} ${txt}`);
    }
    return res.json();
}
