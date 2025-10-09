// Header.tsx
import { CheckCheck, Menu, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import headerBg1 from "../assets/dark_bg.gif";
import headerBg from "../assets/light_bg.gif";

import Avatar from "../assets/ava.png";
import { useAuthStore } from "../stores/auth";
import { IconBell, IconSun } from "./common/Icons";

type Noti = { id: string; title: string; time: string; read?: boolean; desc?: string };

export function Header({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
    const user = useAuthStore((s) => s.user);
    const [isDark, setIsDark] = useState(false);
    const [open, setOpen] = useState(false);
    const [notis, setNotis] = useState<Noti[]>([
        { id: "1", title: "Payment received", time: "2m ago", desc: "You got $120 from John", read: false },
        { id: "2", title: "Upcoming bill", time: "1h ago", desc: "Internet due on Sep 25", read: false },
        { id: "3", title: "Goal reminder", time: "Yesterday", desc: "Save $150 for Emergency fund", read: true },
    ]);
    const unread = notis.filter((n) => !n.read).length;

    const popRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    // Close on ESC
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        if (open) document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    function toggleTheme() {
        setIsDark((prev) => !prev);
        document.documentElement.classList.toggle("dark");
    }

    // Noti actions
    const markAllRead = () => setNotis((arr) => arr.map((n) => ({ ...n, read: true })));
    const clearRead = () => setNotis((arr) => arr.filter((n) => !n.read));
    const clearAll = () => setNotis([]);
    const toggleRead = (id: string) => setNotis((arr) => arr.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));

    return (
        <header
            className="box elev flex items-center justify-between p-4 sm:p-5 max-h-[80px] bg-white dark:bg-gray-900"
            style={{
                backgroundImage: isDark ? `url(${headerBg1})` : `url(${headerBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Left: hamburger (mobile) + title */}
            <div className="flex items-center gap-2">
                <button
                    className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800"
                    aria-label="Open sidebar"
                    onClick={onOpenSidebar}
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div>
                    <div className="text-slate-700 dark:text-slate-100 text-base sm:text-lg font-semibold">Welcome, {user?.name || "Duck"}!</div>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 relative">
                <button className="btn-ghost" aria-label="toggle-theme" onClick={toggleTheme} title="Toggle theme">
                    <IconSun />
                </button>

                <div className="relative" ref={popRef}>
                    <button
                        className="btn-ghost relative"
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-label="notifications"
                        onClick={() => setOpen((o) => !o)}
                    >
                        <IconBell />
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-full bg-rose-500 text-white text-[11px] leading-[18px] text-center font-semibold">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div
                            role="dialog"
                            aria-label="Notifications"
                            className="absolute right-0 mt-2 w-[90vw] max-w-[360px] rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl z-50"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-gray-700">
                                <div className="font-semibold text-slate-800 dark:text-slate-100">
                                    Notifications{unread ? ` (${unread} new)` : ""}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300"
                                        onClick={markAllRead}
                                        title="Mark all as read"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <CheckCheck className="h-4 w-4" /> Read all
                                        </span>
                                    </button>
                                    <button
                                        className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300"
                                        onClick={clearRead}
                                        title="Clear read notifications"
                                    >
                                        Clear read
                                    </button>
                                    <button
                                        className="text-xs px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                                        onClick={clearAll}
                                        title="Delete all"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <Trash2 className="h-4 w-4" /> Clear
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            {notis.length > 0 ? (
                                <ul className="max-h-[60vh] overflow-auto divide-y divide-slate-200 dark:divide-gray-800">
                                    {notis.map((n) => (
                                        <li key={n.id}>
                                            <button
                                                className={`w-full text-left px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                                                    ${n.read ? "bg-white dark:bg-gray-900" : "bg-indigo-50/60 dark:bg-indigo-900/20"}
                                                    hover:bg-slate-50 dark:hover:bg-gray-800`}
                                                onClick={() => toggleRead(n.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* unread dot */}
                                                    {!n.read ? (
                                                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                                    ) : (
                                                        <span className="mt-1 h-2 w-2 rounded-full bg-transparent shrink-0" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p
                                                                className={`truncate font-medium ${
                                                                    n.read ? "text-slate-700 dark:text-slate-200" : "text-slate-900 dark:text-white"
                                                                }`}
                                                            >
                                                                {n.title}
                                                            </p>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{n.time}</span>
                                                        </div>
                                                        {n.desc && (
                                                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{n.desc}</p>
                                                        )}
                                                        <span className="mt-2 inline-block text-xs text-indigo-600 dark:text-indigo-400">
                                                            {n.read ? "Mark as unread" : "Mark as read"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-6 py-10 text-center">
                                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-slate-100 dark:bg-gray-800 grid place-items-center">
                                        <IconBell />
                                    </div>
                                    <div className="font-medium text-slate-700 dark:text-slate-200">All caught up</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">No notifications right now.</div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-4 py-2 border-t border-slate-200 dark:border-gray-700">
                                <button
                                    className="w-full text-center text-sm py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200"
                                    onClick={() => setOpen(false)}
                                >
                                    View all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-slate-200 dark:ring-gray-700">
                    <img src={Avatar} alt="avatar" className="h-full w-full object-cover" />
                </div>
            </div>
        </header>
    );
}
