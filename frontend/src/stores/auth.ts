// src/stores/auth.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppUser = {
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    // tuỳ backend của bạn trả gì thì mở rộng thêm
};

type AuthState = {
    user: AppUser | null;
    token?: string | null; // nếu backend có phát hành JWT, lưu ở đây
    setAuth: (u: AppUser | null, token?: string | null) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            setAuth: (u, token) => set({ user: u, token: token ?? null }),
            logout: () => set({ user: null, token: null }),
        }),
        {
            name: "xp.auth.v1",
            storage: createJSONStorage(() => sessionStorage), // dùng sessionStorage để tránh lưu dài hạn
            // Nếu cần mã hoá: có thể tự bọc encode/decode ở đây (không demo để tránh rườm rà)
            // partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
);
