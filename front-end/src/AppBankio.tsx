import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DesignTokens } from "./styles/DesignTokens";

import { GymLogPage } from "./pages/gym-log/GymLogPage";
import { InvestmentsPage } from "./pages/InvestmentPage";
import LoginPage from "./pages/LoginPage";
import PlaylistPage from "./pages/PlaylistPage";
import { TransactionsPage } from "./pages/TransactionsPage";

export default function AppBankio() {
    const location = useLocation();

    // Trang login: không có Sidebar/Header
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

            <div className="mx-auto max-w-[1400px] grid grid-cols-[260px,minmax(0,1fr)] gap-6 p-6">
                <Sidebar />
                <div className="flex flex-col gap-8">
                    <Header />

                    <Routes>
                        <Route path="/" element={<Navigate to="/spending" replace />} />
                        <Route path="/spending" element={<TransactionsPage />} />
                        <Route path="/playlist" element={<PlaylistPage />} />
                        <Route path="/gym" element={<GymLogPage />} />
                        <Route path="/investments" element={<InvestmentsPage />} />
                        {/* 404 -> về spending */}
                        <Route path="*" element={<Navigate to="/spending" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}
