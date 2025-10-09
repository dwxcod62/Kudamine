// AppBankio.tsx
import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import DemoSomeThing from "./pages/DemoSomething";
import TestSidebar from "./pages/Test_side_bar";
import RequireAuth from "./routes/RequireAuth";
import { useAuthStore } from "./stores/auth";
import { DesignTokens } from "./styles/DesignTokens";

/* ===== Lazy pages (code-splitting) ===== */
const GymLogPage = lazy(() => import("./pages/GymLogPage"));
const InvestmentsPage = lazy(() => import("./pages/InvestmentPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
// SpendingPage là named export -> map sang default cho lazy
const SpendingPage = lazy(() => import("./pages/SpendingPage").then((m) => ({ default: m.SpendingPage })));
const TestPage = lazy(() => import("./pages/Test"));
const WorkoutPageMock = lazy(() => import("./pages/Test2"));
const TimeTablePage = lazy(() => import("./pages/TimeTablePage"));

/* ===== Fallback UI khi đang load chunk ===== */
function Loading() {
    return (
        <div className="w-full py-10 flex items-center justify-center text-slate-500">
            <div className="animate-spin h-5 w-5 rounded-full border-2 border-slate-400 border-t-transparent mr-2" />
            Loading…
        </div>
    );
}

export default function Kudamine() {
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const isAuthed = useAuthStore((s) => Boolean(s.token || s.user?.id));

    const BLANK_ROUTES = new Set<string>(["/login", "/test", "/test_side_bar", "/demo"]);

    if (location.pathname === "/login" && isAuthed) {
        return <Navigate to="/spending" replace />;
    }

    if (BLANK_ROUTES.has(location.pathname)) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-800 dark:text-slate-100">
                <DesignTokens />
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/test" element={<TestPage />} />
                        <Route path="/test_side_bar" element={<TestSidebar />} />
                        <Route path="/demo" element={<DemoSomeThing />} />
                    </Routes>
                </Suspense>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[var(--bg-page)] text-slate-800 dark:text-slate-100">
            <DesignTokens />
            <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-[260px,minmax(0,1fr)] gap-6 p-4 sm:p-6">
                <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
                <div className="flex flex-col gap-6">
                    <Header onOpenSidebar={() => setMobileNavOpen(true)} />
                    <Suspense fallback={<Loading />}>
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
                            <Route
                                path="/test2"
                                element={
                                    <RequireAuth>
                                        <WorkoutPageMock />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/test1"
                                element={
                                    <RequireAuth>
                                        <TestPage />
                                    </RequireAuth>
                                }
                            />
                            <Route
                                path="/timetable"
                                element={
                                    <RequireAuth>
                                        <TimeTablePage />
                                    </RequireAuth>
                                }
                            />
                            <Route path="*" element={<Navigate to="/spending" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
