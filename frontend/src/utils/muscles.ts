// src/lib/muscles.ts (tạo file nhỏ dùng chung FE)
export type MuscleToken =
    | "UpperChest"
    | "MiddleChest"
    | "LowerChest"
    | "Lats"
    | "UpperBack"
    | "LowerBack"
    | "FrontDelts"
    | "LateralDelts"
    | "RearDelts"
    | "Biceps"
    | "Triceps"
    | "Forearms"
    | "Quads"
    | "Hamstrings"
    | "Glutes"
    | "Calves"
    | "Abs"
    | "Obliques"
    | "FullBody";

export const TOKEN_TO_LABEL: Record<MuscleToken, string> = {
    UpperChest: "Upper Chest",
    MiddleChest: "Middle Chest",
    LowerChest: "Lower Chest",
    Lats: "Lats",
    UpperBack: "Upper Back",
    LowerBack: "Lower Back",
    FrontDelts: "Front Delts",
    LateralDelts: "Lateral Delts",
    RearDelts: "Rear Delts",
    Biceps: "Biceps",
    Triceps: "Triceps",
    Forearms: "Forearms",
    Quads: "Quads",
    Hamstrings: "Hamstrings",
    Glutes: "Glutes",
    Calves: "Calves",
    Abs: "Abs",
    Obliques: "Obliques",
    FullBody: "Full Body",
};

// Nếu bạn vẫn đôi khi nhận/nhập label, hỗ trợ map ngược:
const LABEL_TO_TOKEN = Object.fromEntries(Object.entries(TOKEN_TO_LABEL).map(([k, v]) => [v, k])) as Record<string, MuscleToken>;

export function toToken(v: string): MuscleToken | null {
    const t = v.trim().replace(/\s+/g, " ");
    if ((Object.keys(TOKEN_TO_LABEL) as string[]).includes(t)) return t as MuscleToken; // đã là token
    return LABEL_TO_TOKEN[t] ?? null; // là label -> token
}

export function toLabel(v: string): string {
    return TOKEN_TO_LABEL[v as MuscleToken] ?? v; // token -> label; nếu lỡ là label thì trả nguyên
}

export const ALL_MUSCLE_TOKENS = Object.keys(TOKEN_TO_LABEL) as MuscleToken[];
