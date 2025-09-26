import { LogOut, Moon, Plus, Sun, User as UserIcon, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { IconArrows, IconCard, IconChart, IconCog, IconGift, IconGrid, IconLifeRing, IconList, IconShield, IconTrend, Logo } from "./common/Icons";

type Props = {
    text?: string; // chuỗi mục tiêu
    tickMs?: number; // thời gian mỗi lần đổi ký tự random
    scrambleMs?: number; // tổng thời gian xoay cho 1 ký tự
    pauseMs?: number; // dừng nhẹ giữa các ký tự
};

const lower = "abcdefghijklmnopqrstuvwxyz";
const upper = lower.toUpperCase();

function randLike(c: string) {
    if (upper.includes(c)) return upper[Math.floor(Math.random() * upper.length)];
    if (lower.includes(c)) return lower[Math.floor(Math.random() * lower.length)];
    // với ký tự không phải chữ cái (dấu cách, dấu câu) thì giữ nguyên
    return c;
}

export function RollingOneChar({ text = "kudamii", tickMs = 35, scrambleMs = 420, pauseMs = 60 }: Props) {
    const target = text.split("");
    const [display, setDisplay] = useState<string[]>(() => [...target]);
    const idxRef = useRef(0);
    const stopRef = useRef(false);

    useEffect(() => {
        stopRef.current = false;
        setDisplay([...target]); // reset hiển thị ban đầu

        async function loop() {
            // vòng lặp vô hạn
            while (!stopRef.current) {
                const i = idxRef.current;

                // xoay ký tự i trong khoảng scrambleMs
                const start = Date.now();
                // chụp snapshot để hạn chế setState nhiều phần tử
                let base = [...target];

                await new Promise<void>((resolve) => {
                    const timer = setInterval(() => {
                        if (stopRef.current) {
                            clearInterval(timer);
                            resolve();
                            return;
                        }
                        const elapsed = Date.now() - start;
                        if (elapsed >= scrambleMs) {
                            // khóa về ký tự đúng
                            base[i] = target[i];
                            setDisplay(base);
                            clearInterval(timer);
                            resolve();
                        } else {
                            base[i] = randLike(target[i]);
                            setDisplay(base);
                            // NOTE: các vị trí khác vẫn là target (giữ nguyên)TE: các vị trí khác vẫn là target (giữ nguyên)
                        }
                    }, tickMs);
                });

                // dừng nhẹ giữa các ký tự
                if (pauseMs > 0) {
                    await new Promise((r) => setTimeout(r, pauseMs));
                }

                // sang ký tự kế tiếp, quay vòng
                idxRef.current = (i + 1) % target.length;
            }
        }

        loop();

        return () => {
            stopRef.current = true;
        };
    }, [tickMs, scrambleMs, pauseMs]);

    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <span className="font-mono text-5xl tracking-widest select-none">{display.join("")}</span>
        </div>
    );
}

type CurrentUser = {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
};

function NavItem({ icon, label, to, onAfterClick }: { icon: React.ReactNode; label: string; to: string; onAfterClick?: () => void }) {
    return (
        <NavLink to={to} className={({ isActive }) => `leftnav-item ${isActive ? "active" : ""}`} onClick={onAfterClick}>
            <span className="h-5 w-5 shrink-0">{icon}</span>
            <span className="text-[15px] font-semibold">{label}</span>
        </NavLink>
    );
}

function Avatar({ src, size = 40 }: { src?: string | null; size?: number }) {
    return src ? (
        <img src={src} alt="avatar" style={{ width: size, height: size }} className="rounded-full object-cover" />
    ) : (
        <div style={{ width: size, height: size }} className="rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <UserIcon className="w-5 h-5 opacity-70" />
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <div className="mt-4 text-xs uppercase tracking-wide text-slate-500 px-2">{children}</div>;
}

type SidebarProps = {
    /** mobile-only */
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
    /** để cá nhân hóa */
    currentUser?: CurrentUser | null;
    onSignOut?: () => void;
    onToggleTheme?: () => void; // bạn gắn với state theme ngoài app
    isDark?: boolean;
};

export function Sidebar({ mobileOpen = false, onCloseMobile, currentUser, onSignOut, onToggleTheme, isDark }: SidebarProps) {
    // ===== Swipe to close (mobile) =====
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [dragX, setDragX] = useState(0);
    const startXRef = useRef<number | null>(null);

    // ESC để đóng
    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseMobile?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [mobileOpen, onCloseMobile]);

    // Gợi ý quick actions (cá nhân hóa mobile)
    const quickActions = useMemo(
        () => [
            { key: "new-transfer", label: "New Transfer", icon: <IconArrows />, to: "/transfers?new=1" },
            { key: "add-card", label: "Add Card", icon: <IconCard />, to: "/card?add=1" },
            { key: "new-playlist", label: "New Playlist", icon: <Plus className="h-5 w-5" />, to: "/playlist?create=1" },
        ],
        []
    );

    // Gần đây (ví dụ lưu trong localStorage, FE-only)
    const [recents, setRecents] = useState<{ label: string; to: string }[]>([]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem("app.recents");
            if (raw) setRecents(JSON.parse(raw));
        } catch {}
    }, []);

    const MobileHeader = (
        <div className="px-2 pt-[env(safe-area-inset-top)] pb-3">
            <div className="flex items-center gap-2">
                <Avatar src={currentUser?.photoURL} size={42} />
                <div className="min-w-0">
                    <div className="text-sm text-slate-500">Xin chào</div>
                    <div className="font-semibold truncate">{currentUser?.displayName || currentUser?.email || "Guest"}</div>
                </div>

                <button
                    onClick={onToggleTheme}
                    className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Quick actions (tap target to 44px+) */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                {quickActions.map((q) => (
                    <NavLink
                        key={q.key}
                        to={q.to}
                        onClick={onCloseMobile}
                        className="h-14 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex flex-col items-center justify-center gap-1 text-sm"
                    >
                        <span className="h-5 w-5">{q.icon}</span>
                        <span className="truncate px-2">{q.label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );

    const Content = (
        <div className="h-full flex flex-col">
            {/* Desktop title row */}
            <div className="hidden lg:flex items-center gap-2 px-2 py-2">
                <Logo />
                <div className="font-extrabold tracking-tight">
                    <RollingOneChar text="Kudamine" tickMs={35} scrambleMs={420} pauseMs={60} />
                </div>
            </div>

            {/* Mobile personalized header */}
            <div className="lg:hidden">{MobileHeader}</div>

            <SectionTitle>Main Menu</SectionTitle>
            <nav className="leftnav mt-2 grid gap-1 px-2 pb-2">
                <NavItem icon={<IconList />} label="Spending" to="/spending" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconGrid />} label="Gym Dashboard" to="/gym" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconChart />} label="Playlist" to="/playlist" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconTrend />} label="Investments" to="/investments" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconArrows />} label="Transfers" to="/transfers" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconCard />} label="Card" to="/card" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconGift />} label="Rewards" to="/rewards" onAfterClick={onCloseMobile} />
            </nav>

            {/* Recents (mobile ưu tiên) */}
            {recents.length > 0 && (
                <>
                    <SectionTitle>Gần đây</SectionTitle>
                    <div className="mt-2 grid gap-1 px-2">
                        {recents.slice(0, 4).map((r, i) => (
                            <NavLink key={i} to={r.to} className="leftnav-item" onClick={onCloseMobile}>
                                <span className="h-5 w-5 shrink-0">
                                    <IconTrend />
                                </span>
                                <span className="text-[15px] font-semibold truncate">{r.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </>
            )}

            <SectionTitle>Others</SectionTitle>
            <nav className="leftnav mt-2 grid gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
                <NavItem icon={<IconShield />} label="Security" to="/security" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconCog />} label="Settings" to="/settings" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconLifeRing />} label="Support" to="/support" onAfterClick={onCloseMobile} />
                {onSignOut && (
                    <button
                        onClick={() => {
                            onSignOut();
                            onCloseMobile?.();
                        }}
                        className="leftnav-item text-red-600 hover:text-red-700"
                    >
                        <span className="h-5 w-5 shrink-0">
                            <LogOut />
                        </span>
                        <span className="text-[15px] font-semibold">Sign out</span>
                    </button>
                )}
            </nav>
        </div>
    );

    // Handlers vuốt
    const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
        startXRef.current = e.touches[0].clientX;
        setDragX(0);
    };
    const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
        if (startXRef.current == null) return;
        const delta = e.touches[0].clientX - startXRef.current;
        setDragX(Math.min(0, delta));
    };
    const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
        if (dragX < -60) onCloseMobile?.();
        startXRef.current = null;
        setDragX(0);
    };

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="box elev p-4 hidden lg:block h-full sticky top-6">{Content}</aside>

            {/* Mobile drawer */}
            <div className={`lg:hidden ${mobileOpen ? "visible" : "invisible"}`} aria-hidden={!mobileOpen}>
                <div
                    onClick={onCloseMobile}
                    className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    ref={panelRef}
                    className={`fixed z-50 top-0 left-0 h-full w-[82vw] max-w-[340px] box elev p-4
          transition-transform duration-300 ease-out touch-pan-y will-change-transform
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                    style={{ transform: `translateX(calc(${mobileOpen ? "0px" : "-100%"} + ${dragX}px))` }}
                    role="dialog"
                    aria-modal="true"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* Safe area top/bottom */}
                    <div className="pt-[env(safe-area-inset-top)] -mt-[env(safe-area-inset-top)]" />
                    {Content}
                    <div className="pb-[env(safe-area-inset-bottom)] -mb-[env(safe-area-inset-bottom)]" />
                </aside>
            </div>
        </>
    );
}
