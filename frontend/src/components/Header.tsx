// Header.tsx
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

    function toggleTheme() {
        setIsDark((prev) => !prev);
        document.documentElement.classList.toggle("dark");
    }

    return (
        <header className="box elev flex items-center justify-between p-4 sm:p-5 max-h-[80px] bg-white">
            {/* Left: hamburger (mobile) + title */}
            <div className="flex items-center gap-2">
                <button
                    className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100"
                    aria-label="Open sidebar"
                    onClick={onOpenSidebar}
                >
                    <Menu className="h-5 w-5" />
                </button>
                <div>
                    <div className="text-slate-700 text-base sm:text-lg font-semibold">Welcome, {user?.name || "Duck"}!</div>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 relative">
                <button className="btn-ghost" aria-label="toggle-theme" onClick={toggleTheme}>
                    <IconSun />
                </button>

                <div className="relative" ref={popRef}>
                    <button className="btn-ghost relative" aria-label="notifications" onClick={() => setOpen((o) => !o)}>
                        <IconBell />
                        {unread > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-full bg-rose-500 text-white text-[11px] leading-[18px] text-center font-semibold">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-[90vw] max-w-[360px] rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                            {/* ... giữ nguyên phần dropdown như bạn có ... */}
                            {/* (không dán lại toàn bộ cho ngắn gọn) */}
                        </div>
                    )}
                </div>

                <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-slate-200">
                    <img src={Avatar} alt="avatar" className="h-full w-full object-cover" />
                </div>
            </div>
        </header>
    );
}
