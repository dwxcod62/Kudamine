import { useEffect, useRef, useState } from "react";
import Avatar from "../assets/ava.png";
import { IconBell, IconSun } from "./common/Icons";

type Noti = {
    id: string;
    title: string;
    time: string;
    read?: boolean;
    desc?: string;
};

export function Header() {
    const [isDark, setIsDark] = useState(false);
    const [open, setOpen] = useState(false);
    const [notis, setNotis] = useState<Noti[]>([
        { id: "1", title: "Payment received", time: "2m ago", desc: "You got $120 from John", read: false },
        { id: "2", title: "Upcoming bill", time: "1h ago", desc: "Internet due on Sep 25", read: false },
        { id: "3", title: "Goal reminder", time: "Yesterday", desc: "Save $150 for Emergency fund", read: true },
    ]);
    const unread = notis.filter((n) => !n.read).length;

    // outside click to close
    const popRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open]);

    function toggleTheme() {
        setIsDark((prev) => !prev);
        document.documentElement.classList.toggle("dark");
    }

    function toggleDropdown() {
        setOpen((o) => !o);
    }

    function markAllRead() {
        setNotis((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    function clearAll() {
        setNotis([]);
        setOpen(false);
    }

    function markOneRead(id: string) {
        setNotis((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }

    return (
        <header className="box elev flex items-center justify-between p-5 max-h-[80px] bg-white">
            <div>
                <div className="text-slate-700 text-lg font-semibold">Welcome, Kudamii!</div>
            </div>

            <div className="flex items-center gap-3 relative">
                {/* Theme */}
                <button className="btn-ghost" aria-label="toggle-theme" onClick={toggleTheme}>
                    <IconSun />
                </button>

                {/* Notifications */}
                <div className="relative" ref={popRef}>
                    <button className="btn-ghost relative" aria-label="notifications" onClick={toggleDropdown}>
                        <IconBell />
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-full bg-rose-500 text-white text-[11px] leading-[18px] text-center font-semibold">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {open && (
                        <div className="absolute right-0 mt-2 w-[360px] rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b">
                                <div className="font-medium">Notifications</div>
                                <div className="flex gap-2">
                                    <button className="text-xs px-2 py-1 rounded border hover:bg-slate-50" onClick={markAllRead}>
                                        Mark all read
                                    </button>
                                    <button className="text-xs px-2 py-1 rounded border hover:bg-slate-50" onClick={clearAll}>
                                        Clear all
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[320px] overflow-auto divide-y">
                                {notis.length === 0 && <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>}

                                {notis.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => markOneRead(n.id)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${n.read ? "bg-white" : "bg-emerald-50/40"}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`mt-1 h-2 w-2 rounded-full ${n.read ? "bg-slate-300" : "bg-emerald-500"}`} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className={`font-medium ${n.read ? "text-slate-700" : "text-emerald-700"}`}>{n.title}</div>
                                                    <div className="text-xs text-slate-500">{n.time}</div>
                                                </div>
                                                {n.desc && <div className="text-sm text-slate-600 mt-0.5">{n.desc}</div>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="px-4 py-3 border-t">
                                <button
                                    className="w-full text-center text-sm font-medium text-emerald-700 hover:text-emerald-800"
                                    onClick={() => alert("Navigate to full notifications page")}
                                >
                                    View all
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-slate-200">
                    <img src={Avatar} alt="avatar" className="h-full w-full object-cover" />
                </div>
            </div>
        </header>
    );
}
