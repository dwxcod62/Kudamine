// Sidebar.tsx (rút gọn phần liên quan tới menu)
import { CalendarRange } from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { IconCard, IconChart, IconCog, IconGift, IconGym, IconLifeRing, IconList, IconShield, IconTrend } from "../components/common/Icons";
import { useUserSidebar } from "../hooks/Navbar/useUserPrefs";
import { useAuthStore } from "../stores/auth";
function SectionTitle({ children }: { children: React.ReactNode }) {
    return <div className="mt-4 text-xs uppercase tracking-wide text-slate-500 px-2">{children}</div>;
}

function NavItem({ icon, label, to, onAfterClick }: { icon: React.ReactNode; label: string; to: string; onAfterClick?: () => void }) {
    return (
        <NavLink to={to} className={({ isActive }) => `leftnav-item ${isActive ? "active" : ""}`} onClick={onAfterClick}>
            <span className="h-5 w-5 shrink-0">{icon}</span>
            <span className="text-[15px] font-semibold">{label}</span>
        </NavLink>
    );
}

// Map iconKey -> icon
const iconMap: Record<string, React.ReactNode> = {
    spending: <IconList />,
    gym: <IconGym />,
    playlist: <IconChart />,
    investments: <IconTrend />,
    timetable: <CalendarRange className="h-5 w-5 block" />,
    card: <IconCard />,
    rewards: <IconGift />,
    security: <IconShield />,
    settings: <IconCog />,
    support: <IconLifeRing />,
};

export function Test2({ mobileOpen = false, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
    const user = useAuthStore((s) => s.user);
    const userId = user?.id ?? "demo-user";

    const { items, grouped, loading, error, refetch } = useUserSidebar({
        userId,
        includeDisabled: false,
        includeInactive: false,
        groupBy: true,
        pinnedFirst: true,
    });

    const hasData = (grouped && grouped.length > 0) || (!grouped && items && items.length > 0);

    const Content = (
        <div className="h-full flex flex-col">
            {loading ? (
                <>
                    <SectionTitle>Loading</SectionTitle>
                    <nav className="leftnav mt-2 grid gap-1 px-2 pb-2">
                        <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    </nav>
                </>
            ) : error ? (
                <>
                    <SectionTitle>Error</SectionTitle>
                    <div className="px-2 text-sm text-red-600">
                        Không tải được menu.{" "}
                        <button className="underline" onClick={refetch}>
                            Thử lại
                        </button>
                    </div>
                </>
            ) : hasData ? (
                // Có dữ liệu
                <>
                    {grouped
                        ? grouped.map(([groupName, arr]) => (
                              <div key={groupName}>
                                  <SectionTitle>{groupName}</SectionTitle>
                                  <nav className="leftnav mt-2 grid gap-1 px-2 pb-2">
                                      {arr.map((it) => (
                                          <NavItem
                                              key={it.key}
                                              icon={iconMap[ it.key] ?? <IconGym />}
                                              label={it.label}
                                              to={it.path}
                                              onAfterClick={onCloseMobile}
                                          />
                                      ))}
                                  </nav>
                              </div>
                          ))
                        : // nếu groupBy=false, render một section "Main"
                          (() => (
                              <div>
                                  <SectionTitle>Main</SectionTitle>
                                  <nav className="leftnav mt-2 grid gap-1 px-2 pb-2">
                                      {items.map((it) => (
                                          <NavItem
                                              key={it.key}
                                              icon={iconMap[it.iconKey ?? it.key] ?? <IconGym />}
                                              label={it.label}
                                              to={it.path}
                                              onAfterClick={onCloseMobile}
                                          />
                                      ))}
                                  </nav>
                              </div>
                          ))()}
                </>
            ) : (
                <>
                    <SectionTitle>Main</SectionTitle>
                    <nav className="leftnav mt-2 grid gap-1 px-2 pb-2">
                        <div className="px-2 py-1 text-sm text-slate-500">Chưa có mục nào trong sidebar.</div>
                    </nav>
                </>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop */}
            <aside className="box elev p-4 hidden lg:block h-full sticky top-6">{Content}</aside>

            {/* Mobile drawer */}
            <div className={`lg:hidden ${mobileOpen ? "visible" : "invisible"}`} aria-hidden={!mobileOpen}>
                <div
                    onClick={onCloseMobile}
                    className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
                />
                <aside
                    className={`fixed z-50 top-0 left-0 h-full w-[82vw] max-w-[340px] box elev p-4
          transition-transform duration-300 ease-out will-change-transform
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                    role="dialog"
                    aria-modal="true"
                >
                    {Content}
                </aside>
            </div>
        </>
    );
}
