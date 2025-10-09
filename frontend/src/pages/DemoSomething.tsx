// Header.tsx
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, User } from "@heroui/react";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import headerBg1 from "../assets/dark_bg.gif";
import headerBg from "../assets/light-bg-2.gif";
import marqueeMessages from "../assets/text-banner-run.json";
import { IconSun } from "../components/common/Icons";

import Avatar from "../assets/ava.png";
import { IconBell } from "../components/common/Icons";
import { useAuthStore } from "../stores/auth";

type Noti = { id: string; title: string; time: string; read?: boolean; desc?: string };

export default function DemoSomeThing({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
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
        <div className="min-h-1/2 w-1/2">
            <div
                className={`relative overflow-hidden text-sm font-semibold py-1
    ${isDark ? "text-white" : "text-slate-900"}`}
            >
                <div className="animate-marquee whitespace-nowrap">
                    {marqueeMessages.map((item) => {
                        const text = item.text.replace("{{name}}", user?.name || "Duck");
                        return (
                            <span key={item.id} className="mx-4">
                                {text}
                            </span>
                        );
                    })}
                </div>
            </div>

            <header
                className="relative box elev flex items-center justify-between p-4 sm:p-5 max-h-[80px] bg-white dark:bg-gray-900 overflow-hidden"
                style={{
                    backgroundImage: isDark ? `url(${headerBg1})` : `url(${headerBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* Overlay làm tối nền để chữ/nút nổi hơn */}
                <div
                    className="pointer-events-none absolute inset-0 
                  bg-gradient-to-r from-slate-900/35 via-slate-900/10 to-slate-900/35"
                />

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2">
                    <button
                        className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl
                 hover:bg-slate-100/60 dark:hover:bg-gray-800/60"
                        onClick={onOpenSidebar}
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-5 w-5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]" />
                    </button>
                </div>

                {/* Right: gói trong glass-card để nổi bật */}
                <div className="relative z-10">
                    <div
                        className="flex items-center gap-2 sm:gap-3
                    rounded-xl border border-white/50 dark:border-gray-700
                    bg-white/65 dark:bg-gray-900/55 backdrop-blur-md
                    px-2 sm:px-3 py-1 shadow-md"
                    >
                        <button
                            className="h-9 w-9 grid place-items-center rounded-lg
                   hover:bg-white/60 dark:hover:bg-gray-800/60"
                            onClick={toggleTheme}
                            aria-label="toggle-theme"
                            title="Toggle theme"
                        >
                            <IconSun />
                        </button>

                        {/* Nút chuông cũng là glass-btn */}
                        <div className="relative">
                            <button
                                className="relative h-9 w-9 grid place-items-center rounded-lg
                     hover:bg-white/60 dark:hover:bg-gray-800/60"
                                aria-haspopup="dialog"
                                aria-expanded={open}
                                aria-label="notifications"
                                onClick={() => setOpen((o) => !o)}
                            >
                                <IconBell />
                                {unread > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px]
                             rounded-full bg-rose-500 text-white text-[11px] leading-[18px]
                             text-center font-semibold shadow-sm"
                                    >
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </button>
                        </div>

                        <Dropdown placement="bottom-start" backdrop="blur">
                            <DropdownTrigger>
                                <User
                                    as="button"
                                    avatarProps={{
                                        isBordered: true,
                                        src: Avatar,
                                        classNames: { img: "!opacity-100" },
                                    }}
                                    className="transition-transform"
                                    description="@tonyreichert"
                                    name="Tony Reichert"
                                />
                            </DropdownTrigger>
                            <DropdownMenu aria-label="User Actions" variant="flat">
                                <DropdownItem key="settings">My Settings</DropdownItem>
                                <DropdownItem key="team_settings">Team Settings</DropdownItem>
                                <DropdownItem key="analytics">Analytics</DropdownItem>
                                <DropdownItem key="system">System</DropdownItem>
                                <DropdownItem key="configurations">Configurations</DropdownItem>
                                <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
                                <DropdownItem key="logout" color="danger">
                                    Log Out
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            </header>
        </div>
    );
}
