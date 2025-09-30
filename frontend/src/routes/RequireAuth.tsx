// src/routes/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth";

/**
 * Chặn truy cập nếu chưa đăng nhập.
 * Đưa người dùng về /login và lưu "from" để login xong quay lại.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const isAuthed = useAuthStore((s) => Boolean(s.token || s.user?.id));
    const location = useLocation();

    if (!isAuthed) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <>{children}</>;
}
