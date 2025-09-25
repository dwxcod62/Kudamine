import { useMemo, useState } from "react";

/**
 * ASCII Login — poster‑style
 * - Left rail: vertical slogan
 * - Center card: ASCII "blob" header + login form
 * - Halftone/bitmap feel using unicode blocks ░▒▓ and █
 * - No external libs required. Drop in any React+Tailwind app.
 */
export default function LoginPage() {
    return (
        <div className="min-h-screen w-full bg-[#eaf0ff] text-[#181a22] font-sans relative overflow-hidden">
            {/* floating pixels */}
            <FloatingPixels />

            <div className="mx-auto max-w-6xl grid md:grid-cols-[120px_1fr] gap-6 px-6 py-10 items-center">
                <LeftRail />
                <LoginCard />
            </div>

            <footer className="text-center text-xs text-[#6b6f7a] py-6 select-none">morda‑inspired ASCII layout (custom, no logos)</footer>
        </div>
    );
}

function LeftRail() {
    return (
        <div className="hidden md:flex items-center justify-center select-none">
            <div className="text-[#2b39ff] font-[600] tracking-[-.02em]" style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
                <span className="text-[40px] leading-none">Like Running?</span>
                <span className="h-6 inline-block" />
                <span className="text-[40px] leading-none">Invest Now.</span>
            </div>
        </div>
    );
}

function LoginCard() {
    return (
        <div className="relative rounded-3xl bg-white shadow-[0_20px_60px_rgba(23,31,56,.15)] border border-[#cfd6ff] overflow-hidden">
            {/* ASCII header */}
            <AsciiHeader />

            {/* form */}
            <div className="grid md:grid-cols-2 gap-6 p-6 md:p-8">
                <FormFields />
                <BlendedPanel />
            </div>
        </div>
    );
}

function AsciiHeader() {
    const ascii = useMemo(() => buildAsciiBlob(), []);
    return (
        <div className="relative">
            <div className="absolute inset-0 bg-[#2b39ff] opacity-10" />
            <pre className="relative z-10 w-full overflow-hidden p-6 md:p-8 bg-[#dfe6ff] text-[#2b39ff] rounded-t-3xl font-mono text-[10px] leading-[10px] md:text-[11px] md:leading-[11px] select-none">
                {ascii}
            </pre>
            {/* dividing seam */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a9b3ff] to-transparent" />
        </div>
    );
}

function FormFields() {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">Sign in</h2>
            <p className="text-sm text-[#6b6f7a] mb-6">Welcome back — keep your portfolio in motion.</p>

            <label className="block text-xs uppercase tracking-widest text-[#6b6f7a]">Email</label>
            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-[#cfd6ff] bg-white px-4 py-3 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-[#2b39ff]/20"
            />

            <div className="h-4" />
            <label className="block text-xs uppercase tracking-widest text-[#6b6f7a]">Password</label>
            <AsciiPassword value={pw} onChange={setPw} />

            <div className="mt-6 flex items-center justify-between">
                <button className="rounded-full bg-[#2b39ff] text-white px-5 py-2.5 text-sm font-semibold shadow-[0_8px_20px_rgba(43,57,255,.35)] hover:translate-y-[-1px] transition-transform">
                    Continue
                </button>
                <a className="text-sm text-[#2b39ff] hover:underline" href="#">
                    Forgot?
                </a>
            </div>
        </div>
    );
}

/** Password field with ASCII mask that animates characters into ▓ */
function AsciiPassword({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [focused, setFocused] = useState(false);
    const masked = useMemo(() => value.replace(/./g, "▓"), [value]);

    return (
        <div className="relative group">
            {/* Visible ASCII mask layer */}
            <div
                className={`font-mono text-sm px-4 py-3 border rounded-xl ${
                    focused ? "border-[#2b39ff] ring-4 ring-[#2b39ff]/15" : "border-[#cfd6ff]"
                } text-[#181a22] bg-white tracking-[.15em] select-none`}
            >
                {masked || "░░░░░░░░"}
            </div>
            {/* Real input overlay for accessibility */}
            <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                aria-label="Password"
            />
        </div>
    );
}

function BlendedPanel() {
    return (
        <div className="relative rounded-2xl border border-[#cfd6ff] bg-white p-4 md:p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-28 bg-[#2b39ff]/10" />
            <div className="relative grid grid-cols-2 gap-3">
                <MiniAscii title="Halftone" density="▒▓" />
                <MiniAscii title="Dots" density="·•" />
                <MiniAscii title="Waves" density="≈≋" />
                <MiniAscii title="Pixels" density="▞▚" />
            </div>
        </div>
    );
}

function MiniAscii({ title, density }: { title: string; density: string }) {
    const art = useMemo(() => makeHalftone(18, 8, density), [density]);
    return (
        <div className="rounded-xl bg-[#f5f7ff] border border-[#d7ddff] p-3">
            <div className="text-[10px] uppercase tracking-widest text-[#6b6f7a] mb-1">{title}</div>
            <pre className="font-mono text-[9px] leading-[9px] text-[#2b39ff] select-none">{art}</pre>
        </div>
    );
}

function FloatingPixels() {
    const dots = useMemo(() => {
        const items: { left: string; top: string }[] = [];
        for (let i = 0; i < 50; i++) {
            items.push({ left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%` });
        }
        return items;
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none select-none">
            {dots.map((d, i) => (
                <span key={i} className="absolute text-[#2b39ff] text-[8px] opacity-60" style={{ left: d.left, top: d.top }}>
                    ▪
                </span>
            ))}
        </div>
    );
}

/** --- helpers --- */
function makeHalftone(w: number, h: number, density = "░▒▓█") {
    const levels = density.split("");
    const rows: string[] = [];
    for (let y = 0; y < h; y++) {
        let line = "";
        for (let x = 0; x < w; x++) {
            const v = Math.sin(x * 0.7) + Math.cos(y * 0.6) + Math.sin((x + y) * 0.25);
            const idx = clamp(Math.floor(((v + 2) / 4) * levels.length), 0, levels.length - 1);
            line += levels[idx];
        }
        rows.push(line);
    }
    return rows.join("\n");
}

function buildAsciiBlob() {
    // A stylized top/bottom split blob — avoids any trademarked shape
    const top = `
█████████████████████████████████████████████████████
█████████████████████████████████████████████████████
█████████████████████████████████████████████████████
█████████████████████████████████████████████████████
█████████████████████████████████████████████████████
███████████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒████████████████████
███████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██████████████████
█████████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒████████████████
███████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒██████████████
██████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒█████████████
`;
    const bottom = makeHalftone(52, 16, "░▒");
    return top + bottom;
}

const clamp = (n: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, n));
