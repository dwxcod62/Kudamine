import { Heart, Pause, Pencil, Play, Plus, Search, SkipBack, SkipForward, Trash2, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import {
    addTracks as apiAddTracks,
    createPlaylist as apiCreatePlaylist,
    getPlaylist as apiGetPlaylist,
    listPlaylists as apiListPlaylists,
    listTracks as apiListTracks,
    removeTrack as apiRemoveTrack,
    updatePlaylist as apiUpdatePlaylist,
    updateTrack as apiUpdateTrack,
    type SrvPlaylist,
    type SrvTrack,
} from "../lib/playlistApi";

type Track = {
    id: string;
    title: string;
    artist?: string;
    youtubeId: string;
    cover?: string;
    liked?: boolean;
    duration?: number;
    addedAt: number;
    position?: number;
};

const toUI = (t: SrvTrack): Track => ({
    id: t.id,
    title: t.title,
    artist: t.artist ?? "",
    youtubeId: t.youtubeId,
    cover: t.coverUrl ?? undefined,
    liked: !!t.liked,
    duration: t.durationS ?? undefined,
    addedAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
    position: t.position ?? 0,
});
const toAPITrackCreate = (t: Track) => ({
    title: t.title,
    artist: t.artist || undefined,
    youtubeId: t.youtubeId,
    coverUrl: t.cover || undefined,
    durationS: t.duration ?? undefined,
    position: t.position ?? 0,
});

// ===== helpers =====
function extractYouTubeId(input: string): string | null {
    try {
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
        const url = new URL(input);
        if (url.hostname.includes("youtube.com")) {
            const id = url.searchParams.get("v");
            if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
            const parts = url.pathname.split("/");
            const maybeId = parts[parts.length - 1];
            if (/^[a-zA-Z0-9_-]{11}$/.test(maybeId)) return maybeId;
        }
        if (url.hostname === "youtu.be") {
            const id = url.pathname.replace("/", "");
            if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
        }
        return null;
    } catch {
        return /^[a-zA-Z0-9_-]{11}$/.test(input) ? input : null;
    }
}
const fmtTime = (sec?: number) => {
    if (sec === undefined || sec === null) return "—";
    const s = Math.max(0, Math.round(sec));
    const m = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, "0");
    return `${m}:${ss}`;
};
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const relMin = (ms: number) => rtf.format(Math.round((ms - Date.now()) / 60000), "minute");

export default function PlaylistPage() {
    const USER_ID = "c4e1d3a0-8be7-4533-b187-eaad52d03705";

    const initialPid = typeof window !== "undefined" ? new URLSearchParams(location.search).get("pid") : null;

    const [playlist, setPlaylist] = useState<SrvPlaylist | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [plTitle, setPlTitle] = useState<string>("My Playlist");
    const [plCover, setPlCover] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [currentId, setCurrentId] = useState<string | undefined>(undefined);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState<number>(() => {
        const v = Number(localStorage.getItem("playlist.volume.v1"));
        return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 80;
    });
    const [query, setQuery] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [newUrl, setNewUrl] = useState("");

    const [currentTime, setCurrentTime] = useState(0);
    const [durationUi, setDurationUi] = useState(0);
    const ytRef = useRef<any>(null);

    // ===== initial load: ensure playlist exists, then load tracks =====
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError(null);

                let pl: SrvPlaylist | null = null;
                if (initialPid) {
                    pl = await apiGetPlaylist(initialPid);
                } else {
                    const list = await apiListPlaylists(USER_ID);
                    pl = list[0] ?? null;
                    if (!pl) {
                        pl = await apiCreatePlaylist(USER_ID, "My Playlist");
                    }
                    // đẩy pid lên URL cho share
                    const url = new URL(location.href);
                    url.searchParams.set("pid", pl.id);
                    history.replaceState(null, "", url.toString());
                }

                setPlaylist(pl);
                setPlTitle(pl.title);
                setPlCover(pl.coverUrl ?? null);

                const srvTracks = pl.tracks ?? (await apiListTracks(pl.id));
                const uiTracks = srvTracks.map(toUI);
                setTracks(uiTracks);
                    setCurrentId(uiTracks[0]?.id);
                } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "Load failed");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        localStorage.setItem("playlist.volume.v1", String(volume));
        ytRef.current?.setVolume?.(volume);
    }, [volume]);

    // ===== progress timer =====
    useEffect(() => {
        if (!playing) return;
        const it = setInterval(() => {
            try {
                const d = Math.round(ytRef.current?.getDuration?.() ?? 0);
                const ct = Math.round(ytRef.current?.getCurrentTime?.() ?? 0);
                if (Number.isFinite(d)) setDurationUi(d);
                if (Number.isFinite(ct)) setCurrentTime(ct);
            } catch {}
        }, 500);
        return () => clearInterval(it);
    }, [playing]);

    const current = useMemo(() => tracks.find((t) => t.id === currentId), [tracks, currentId]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return tracks;
        return tracks.filter((t) => t.title.toLowerCase().includes(q) || (t.artist ?? "").toLowerCase().includes(q));
    }, [tracks, query]);

    // ===== controls =====
    const togglePlay = () => {
        if (!current) return;
        if (!ytRef.current) {
            setPlaying(true);
            return;
        }
        const state = ytRef.current.getPlayerState?.(); // 1 playing, 2 paused
        if (state === 1) {
            ytRef.current.pauseVideo?.();
            setPlaying(false);
        } else {
            ytRef.current.playVideo?.();
            setPlaying(true);
        }
    };
    const playTrack = (id: string) => {
        setCurrentId(id);
        setPlaying(true);
        setCurrentTime(0);
    };
    const nextTrack = () => {
        if (!current || tracks.length === 0) return;
        const idx = tracks.findIndex((t) => t.id === current.id);
        const next = tracks[(idx + 1) % tracks.length];
        setCurrentId(next.id);
        setPlaying(true);
        setCurrentTime(0);
    };
    const prevTrack = () => {
        if (!current || tracks.length === 0) return;
        const idx = tracks.findIndex((t) => t.id === current.id);
        const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
        setCurrentId(prev.id);
        setPlaying(true);
        setCurrentTime(0);
    };
    const seekTo = (sec: number) => {
        ytRef.current?.seekTo?.(sec, true);
        setCurrentTime(sec);
    };

    // ===== server sync actions =====
    const likeToggle = async (id: string) => {
        // optimistic
        setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, liked: !t.liked } : t)));
        try {
            await apiUpdateTrack(id, { liked: tracks.find((t) => t.id === id)?.liked ? false : true });
        } catch (e) {
            // rollback nếu cần: refetch
            console.error(e);
        }
    };

    const removeTrack = async (id: string) => {
        // optimistic
        setTracks((prev) => prev.filter((t) => t.id !== id));
        if (currentId === id) {
            const remain = tracks.filter((t) => t.id !== id);
            setCurrentId(remain[0]?.id);
            setPlaying(false);
            setCurrentTime(0);
        }
        try {
            await apiRemoveTrack(id);
        } catch (e) {
            console.error(e);
        }
    };

    const addTrack = async () => {
        if (!playlist) return;
        const id = extractYouTubeId(newUrl.trim());
        if (!id || !newTitle.trim()) return;

        try {
            const created = await apiAddTracks(playlist.id, [
                toAPITrackCreate({
                    id: "tmp",
                    title: newTitle.trim(),
                    artist: "",
                    youtubeId: id,
                    addedAt: Date.now(),
                    position: (tracks?.[tracks.length - 1]?.position ?? 0) + 1,
                } as Track),
            ]);
            const ui = created.map(toUI);
            setTracks((prev) => [...ui, ...prev]); // thêm đầu danh sách giống UI cũ
            setNewTitle("");
            setNewUrl("");
        } catch (e) {
            console.error(e);
        }
    };

    // ===== YouTube events =====
    const onReady = (e: any) => {
        ytRef.current = e.target;
        ytRef.current.setVolume?.(volume);
        if (playing) ytRef.current.playVideo?.();
        try {
            const d = Math.round(ytRef.current?.getDuration?.() ?? 0);
            if (Number.isFinite(d)) setDurationUi(d);
        } catch {}
    };
    const onStateChange = async (e: any) => {
        if (e.data === 0) nextTrack();
        if (e.data === 1) setPlaying(true);
        if (e.data === 2) setPlaying(false);
        try {
            const d = Math.round(e.target.getDuration?.() ?? 0);
            if (current && d && !current.duration) {
                // lưu durationS lên server (best-effort)
                setTracks((prev) => prev.map((t) => (t.id === current.id ? { ...t, duration: d } : t)));
                try {
                    await apiUpdateTrack(current.id, { durationS: d });
                } catch {}
            }
        } catch {}
    };

    // ===== edit title & cover (sync server) =====
    useEffect(() => {
        if (editingTitle) {
            const t = setTimeout(() => titleInputRef.current?.focus(), 0);
            return () => clearTimeout(t);
        }
    }, [editingTitle]);

    const startEditTitle = () => setEditingTitle(true);
    const commitTitle = async () => {
        const v = titleInputRef.current?.value?.trim();
        if (!playlist) return setEditingTitle(false);
        if (v && v !== playlist.title) {
            setPlTitle(v);
            try {
                const up = await apiUpdatePlaylist(playlist.id, { title: v });
                setPlaylist(up);
            } catch (e) {
                console.error(e);
            }
        }
        setEditingTitle(false);
    };
    const cancelTitle = () => {
        if (titleInputRef.current) titleInputRef.current.value = plTitle;
        setEditingTitle(false);
    };
    const onTitleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") commitTitle();
        if (e.key === "Escape") cancelTitle();
    };

    const openCoverPicker = () => fileInputRef.current?.click();
    const saveCover = async (url: string | null) => {
        if (!playlist) return;
        setPlCover(url);
        try {
            const up = await apiUpdatePlaylist(playlist.id, { coverUrl: url ?? undefined });
            setPlaylist(up);
        } catch (e) {
            console.error(e);
        }
    };
    const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        const fr = new FileReader();
        fr.onload = () => saveCover(String(fr.result));
        fr.readAsDataURL(file);
        e.target.value = "";
    };
    const onCoverContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const url = prompt("Paste image URL:");
        if (url === null) return;
        saveCover(url.trim() || null);
    };

    if (loading) return <div className="p-6">Loading playlist…</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="w-full">
            <section
                className="rounded-2xl p-6"
                style={{ background: "var(--surface)", boxShadow: "var(--elev)", border: "1px solid var(--border)" }}
            >
                {/* Header */}
                <div className="flex items-end gap-6">
                    {/* Cover */}
                    <div
                        role="button"
                        aria-label="Change cover"
                        onClick={openCoverPicker}
                        onContextMenu={onCoverContextMenu}
                        className="relative rounded-md overflow-hidden"
                        style={{ width: 96, height: 96, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer" }}
                        title="Click to change cover • Right-click to set by URL"
                    >
                        {plCover ? (
                            <img src={plCover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span style={{ fontSize: 36, fontWeight: 800 }}>♪</span>
                            </div>
                        )}
                        <div
                            className="absolute bottom-1 right-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{ background: "var(--chip-bg)", color: "var(--chip-fg)" }}
                        >
                            <Pencil className="inline h-3 w-3 mr-1" />
                            Edit
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickCover} hidden />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-xs uppercase" style={{ color: "var(--muted)" }}>
                            Playlist
                        </div>

                        {!editingTitle ? (
                            <h1
                                className="truncate"
                                onClick={startEditTitle}
                                style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.1, color: "var(--text)", cursor: "text" }}
                                title="Click to rename"
                            >
                                {plTitle}
                            </h1>
                        ) : (
                            <input
                                ref={titleInputRef}
                                defaultValue={plTitle}
                                onBlur={commitTitle}
                                onKeyDown={onTitleKey}
                                className="w-full rounded-md px-2 py-1 outline-none"
                                style={{
                                    fontSize: 28,
                                    fontWeight: 800,
                                    background: "var(--surface-2)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text)",
                                }}
                            />
                        )}

                        <div className="text-sm" style={{ color: "var(--muted)" }}>
                            me • {tracks.length} songs
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={togglePlay}
                                    className="h-12 w-12 rounded-full flex items-center justify-center"
                                    style={{ background: "var(--btn-bg)", color: "var(--btn-fg)" }}
                                    aria-label="play"
                                >
                                    {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                                </button>
                                <button
                                    onClick={prevTrack}
                                    className="h-10 w-10 rounded-full flex items-center justify-center"
                                    style={{ border: "1px solid var(--btn-ghost-bd)", color: "var(--btn-ghost-fg)" }}
                                    title="Previous"
                                >
                                    <SkipBack className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={nextTrack}
                                    className="h-10 w-10 rounded-full flex items-center justify-center"
                                    style={{ border: "1px solid var(--btn-ghost-bd)", color: "var(--btn-ghost-fg)" }}
                                    title="Next"
                                >
                                    <SkipForward className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Volume */}
                            <div className="flex items-center gap-2 ml-2" style={{ color: "var(--muted)" }}>
                                {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
                            </div>

                            {/* Progress / Seek */}
                            <div className="flex items-center gap-2 w-full max-w-md ml-auto" style={{ color: "var(--muted)" }}>
                                <span className="text-xs tabular-nums w-10">{fmtTime(currentTime)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={Math.max(1, durationUi)}
                                    value={Math.min(currentTime, durationUi)}
                                    onChange={(e) => seekTo(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs tabular-nums w-10 text-right">{fmtTime(durationUi)}</span>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--muted)" }} />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search songs..."
                                    className="pl-8 pr-3 py-2 rounded-md outline-none"
                                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add new track */}
                <div className="mt-6 flex flex-col md:flex-row gap-2">
                    <input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Song title"
                        className="flex-1 rounded-md px-3 py-2 outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                    <input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="YouTube link or ID"
                        className="flex-[2] rounded-md px-3 py-2 outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                    <button
                        onClick={addTrack}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-semibold"
                        style={{ background: "var(--btn-bg)", color: "var(--btn-fg)" }}
                    >
                        <Plus className="h-4 w-4" /> Add
                    </button>
                </div>

                {/* Table */}
                <div className="mt-4 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                    <table className="w-full text-sm table">
                        <thead>
                            <tr>
                                {["#", "Title", "Artist", "Added", "Time", "Actions"].map((h, i) => (
                                    <th
                                        key={h}
                                        className={i === 0 ? "w-12" : i === 4 ? "w-24 text-right" : i === 5 ? "w-40" : ""}
                                        style={{ background: "var(--surface-2)" }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t, i) => {
                                const isActive = t.id === currentId;
                                return (
                                    <tr
                                        key={t.id}
                                        style={{ borderTop: "1px solid var(--border)", background: isActive ? "rgba(15,107,95,.08)" : "transparent" }}
                                    >
                                        <td>{i + 1}</td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => (isActive ? togglePlay() : playTrack(t.id))}
                                                    className="h-8 w-8 rounded-full flex items-center justify-center"
                                                    style={{ border: "1px solid var(--btn-ghost-bd)", color: "var(--btn-ghost-fg)" }}
                                                    aria-label="play-track"
                                                >
                                                    {isActive && playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                </button>
                                                <div>
                                                    <div className="font-medium" style={{ color: "var(--text)" }}>
                                                        {t.title}
                                                    </div>
                                                    <div className="text-xs md:hidden" style={{ color: "var(--muted)" }}>
                                                        {t.artist}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell" style={{ color: "var(--text)" }}>
                                            {t.artist || "—"}
                                        </td>
                                        <td className="hidden sm:table-cell" style={{ color: "var(--muted)" }}>
                                            {relMin(t.addedAt)}
                                        </td>
                                        <td className="text-right tabular-nums" style={{ color: "var(--text)" }}>
                                            {fmtTime(t.duration)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => likeToggle(t.id)}
                                                    className="h-8 w-8 rounded-full flex items-center justify-center"
                                                    style={{
                                                        background: t.liked ? "rgba(236,72,153,.2)" : "transparent",
                                                        border: "1px solid var(--btn-ghost-bd)",
                                                        color: t.liked ? "#ec4899" : "var(--btn-ghost-fg)",
                                                    }}
                                                    title="Like"
                                                >
                                                    <Heart className={`h-4 w-4 ${t.liked ? "fill-current" : ""}`} />
                                                </button>
                                                <button
                                                    onClick={() => removeTrack(t.id)}
                                                    className="h-8 w-8 rounded-full flex items-center justify-center"
                                                    style={{ border: "1px solid var(--btn-ghost-bd)", color: "var(--btn-ghost-fg)" }}
                                                    title="Remove"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center" style={{ color: "var(--muted)" }}>
                                        No songs
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* hidden player */}
            <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden>
                {current && (
                    <YouTube
                        videoId={extractYouTubeId(current.youtubeId) ?? undefined}
                        opts={{
                            height: "0",
                            width: "0",
                            playerVars: { autoplay: playing ? 1 : 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1 },
                        }}
                        onReady={onReady}
                        onStateChange={onStateChange}
                    />
                )}
            </div>
        </div>
    );
}
