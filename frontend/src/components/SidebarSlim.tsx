// SidebarSlim.tsx
import { CalendarRange, LogOut, Moon, Plus, Sun } from "lucide-react";
import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import Avatar from "../assets/ava.png";
import { useAuthStore } from "../stores/auth";
import { IconCard, IconChart, IconCog, IconGift, IconGrid, IconLifeRing, IconList, IconShield, IconTrend, Logo } from "./common/Icons";

type SidebarSlimProps = {
    isDark?: boolean;
    onToggleTheme?: () => void;
    onSignOut?: () => void;
};

type Item = {
    to: string;
    label: string;
    icon: React.ReactNode;
};

export default function SidebarSlim({ isDark, onToggleTheme, onSignOut }: SidebarSlimProps) {
    const user = useAuthStore((s) => s.user);

    const mainItems: Item[] = useMemo(
        () => [
            { to: "/spending", label: "Spending", icon: <IconList /> },
            { to: "/gym", label: "Gym", icon: <IconGrid /> },
            { to: "/playlist", label: "Playlist", icon: <IconChart /> },
            { to: "/investments", label: "Investments", icon: <IconTrend /> },
            { to: "/timetable", label: "Time Table", icon: <CalendarRange /> },
            { to: "/card", label: "Card", icon: <IconCard /> },
            { to: "/rewards", label: "Rewards", icon: <IconGift /> },
        ],
        []
    );

    const otherItems: Item[] = [
        { to: "/security", label: "Security", icon: <IconShield /> },
        { to: "/settings", label: "Settings", icon: <IconCog /> },
        { to: "/support", label: "Support", icon: <IconLifeRing /> },
    ];

    return (
        <aside
            className="
      fixed left-0 top-0 h-full z-40
      w-[74px] shrink-0
      border-r border-white/10 dark:border-black/20
      bg-white/60 dark:bg-slate-900/40
      backdrop-blur-xl
      supports-[backdrop-filter]:bg-white/10
      px-2 pt-3 pb-2
      flex flex-col items-center gap-2
      "
        >
            {/* Logo pill */}
            <div className="mb-1 flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow">
                <Logo />
            </div>

            {/* Theme toggle */}
            <button onClick={onToggleTheme} className="rail-btn" title={isDark ? "Light mode" : "Dark mode"} aria-label="Toggle theme">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Main group */}
            <RailGroup>
                {mainItems.map((it) => (
                    <RailLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
                ))}
            </RailGroup>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Others */}
            <RailGroup>
                {otherItems.map((it) => (
                    <RailLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
                ))}
            </RailGroup>

            {/* Sign out + Avatar */}
            {onSignOut && (
                <button onClick={onSignOut} className="rail-btn text-rose-500 hover:text-rose-600" title="Sign out">
                    <LogOut className="h-5 w-5" />
                </button>
            )}

            <div className="mt-2 mb-1">
                <img src={Avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20" />
            </div>

            {/* Floating create (like the + in the screenshot) */}
            <NavLink
                to="/create?quick=1"
                className="
          group fixed bottom-5 right-5 lg:left-[86px]
          h-12 w-12 rounded-2xl
          bg-gradient-to-br from-indigo-500 to-sky-500 text-white
          shadow-xl hover:shadow-2xl active:scale-95
          inline-flex items-center justify-center
        "
                title="Quick Create"
                aria-label="Quick Create"
            >
                <Plus className="h-6 w-6" />
            </NavLink>
        </aside>
    );
}

/** Small helpers **/

function RailGroup({ children }: { children: React.ReactNode }) {
    return <div className="mt-1 flex flex-col items-center gap-1 w-full">{children}</div>;
}

/** Reusable button style for the rail (44x44, rounded) */
export function RailButtonBase({ children, title }: { children: React.ReactNode; title?: string }) {
    return (
        <div
            className="
        rail-btn
      "
            title={title}
        >
            {children}
        </div>
    );
}

function RailLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                ["rail-btn relative", isActive ? "text-indigo-500 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"].join(" ")
            }
            title={label}
        >
            {/* Active indicator */}
            {({ isActive }: any) => (
                <>
                    {isActive && <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-indigo-500" />}
                    <span className="h-5 w-5">{icon}</span>
                </>
            )}
        </NavLink>
    );
}
