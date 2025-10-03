// AppBankio.tsx
import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DesignTokens } from "./styles/DesignTokens";

import GymLogPage from "./pages/GymLogPage";
import InvestmentsPage from "./pages/InvestmentPage";
import LoginPage from "./pages/LoginPage";
import PlaylistPage from "./pages/PlaylistPage";
import SettingsPage from "./pages/SettingsPage";
import { SpendingPage } from "./pages/SpendingPage";
import TestPage from "./pages/Test";
import WorkoutPageMock from "./pages/Test2";
import RequireAuth from "./routes/RequireAuth";
import { useAuthStore } from "./stores/auth";

export default function Kudamine() {
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const isAuthed = useAuthStore((s) => Boolean(s.token || s.user?.id));

    const BLANK_ROUTES = new Set<string>(["/login", "/test", "/test2"]);

    // Nếu đang ở /login mà đã đăng nhập -> đá về /spending
    if (location.pathname === "/login" && isAuthed) {
        return <Navigate to="/spending" replace />;
    }

    if (BLANK_ROUTES.has(location.pathname)) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-800 dark:text-slate-100">
                <DesignTokens />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/test2" element={<WorkoutPageMock />} />
                </Routes>
            </div>
        );
    }

    // Các route còn lại dùng layout + bắt buộc đăng nhập
    return (
        <div className="min-h-screen w-full bg-[var(--bg-page)] text-slate-800 dark:text-slate-100">
            <DesignTokens />
            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[260px,minmax(0,1fr)] gap-6 p-4 sm:p-6">
                <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
                <div className="flex flex-col gap-6">
                    <Header onOpenSidebar={() => setMobileNavOpen(true)} />
                    <Routes>
                        <Route path="/" element={<Navigate to="/spending" replace />} />
                        <Route
                            path="/spending"
                            element={
                                <RequireAuth>
                                    <SpendingPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/playlist"
                            element={
                                <RequireAuth>
                                    <PlaylistPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/gym"
                            element={
                                <RequireAuth>
                                    <GymLogPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/investments"
                            element={
                                <RequireAuth>
                                    <InvestmentsPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <RequireAuth>
                                    <SettingsPage />
                                </RequireAuth>
                            }
                        />
                        {/* <Route
                            path="/test2"
                            element={
                                <RequireAuth>
                                    <WorkoutPageMock />
                                </RequireAuth>
                            }
                        /> */}
                        <Route path="*" element={<Navigate to="/spending" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}
