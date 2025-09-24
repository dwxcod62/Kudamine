import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { IconArrows, IconCard, IconChart, IconCog, IconGift, IconGrid, IconLifeRing, IconList, IconShield, IconTrend, Logo } from "./common/Icons";

function NavItem({ icon, label, to, onAfterClick }: { icon: React.ReactNode; label: string; to: string; onAfterClick?: () => void }) {
    return (
        <NavLink to={to} className={({ isActive }) => `leftnav-item ${isActive ? "active" : ""}`} onClick={onAfterClick}>
            <span className="h-5 w-5 shrink-0">{icon}</span>
            <span className="text-[15px] font-semibold">{label}</span>
        </NavLink>
    );
}

type SidebarProps = {
    /** mobile-only */
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
};

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
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

    const Content = (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-2 py-2 pt-[env(safe-area-inset-top)]">
                <Logo />
                <div className="font-extrabold tracking-tight">Bankio</div>
                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="ml-auto inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="mt-3 text-xs uppercase tracking-wide text-slate-500 px-2">Main Menu</div>
            <nav className="leftnav mt-2 grid gap-1 px-2 pb-2">
                <NavItem icon={<IconList />} label="Spending" to="/spending" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconGrid />} label="Gym Dashboard" to="/gym" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconChart />} label="Playlist" to="/playlist" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconTrend />} label="Investments" to="/investments" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconArrows />} label="Transfers" to="/transfers" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconCard />} label="Card" to="/card" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconGift />} label="Rewards" to="/rewards" onAfterClick={onCloseMobile} />
            </nav>

            <div className="mt-4 text-xs uppercase tracking-wide text-slate-500 px-2">Others</div>
            <nav className="leftnav mt-2 grid gap-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
                <NavItem icon={<IconShield />} label="Security" to="/security" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconCog />} label="Settings" to="/settings" onAfterClick={onCloseMobile} />
                <NavItem icon={<IconLifeRing />} label="Support" to="/support" onAfterClick={onCloseMobile} />
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
                    className={`fixed z-50 top-0 left-0 h-full w-[82vw] max-w-[320px] box elev p-4
            transition-transform duration-300 ease-out touch-pan-y will-change-transform
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                    style={{ transform: `translateX(calc(${mobileOpen ? "0px" : "-100%"} + ${dragX}px))` }}
                    role="dialog"
                    aria-modal="true"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {Content}
                </aside>
            </div>
        </>
    );
}
