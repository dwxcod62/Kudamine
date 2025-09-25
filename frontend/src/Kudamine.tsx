// AppBankio.tsx
import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DesignTokens } from "./styles/DesignTokens";

import { GymLogPage } from "./pages/GymLogPage";
import InvestmentsPage from "./pages/InvestmentPage";
import LoginPage from "./pages/LoginPage";
import PlaylistPage from "./pages/PlaylistPage";
import SettingsPage from "./pages/SettingsPage";
import { SpendingPage } from "./pages/SpendingPage";

export default function Kudamine() {
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    if (location.pathname === "/login") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-slate-800 dark:text-slate-100">
                <DesignTokens />
                <LoginPage />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[var(--bg-page)] text-slate-800 dark:text-slate-100">
            <DesignTokens />

            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[260px,minmax(0,1fr)] gap-6 p-4 sm:p-6">
                {/* Sidebar: desktop sticky + mobile drawer */}
                <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

                <div className="flex flex-col gap-6">
                    <Header onOpenSidebar={() => setMobileNavOpen(true)} />

                    <Routes>
                        <Route path="/" element={<Navigate to="/spending" replace />} />
                        <Route path="/spending" element={<SpendingPage />} />
                        <Route path="/playlist" element={<PlaylistPage />} />
                        <Route path="/gym" element={<GymLogPage />} />
                        <Route path="/investments" element={<InvestmentsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/spending" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}
