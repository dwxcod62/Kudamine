// // WindowsXPLogin.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import Bground from "../assets/2825727.gif";
// import RollingOneChar from "../components/RollingOneChar";
// import { randomString } from "../helpers/randomString";
// import { useBlinkCursor } from "../helpers/useBlinkCursor";
// import { postJSON } from "../lib/login";
// import { useAuthStore } from "../stores/auth";
// /**
//  * Windows XP Login Screen (React + TailwindCSS)
//  * Optimized for desktop + mobile
//  */

// type LoginCodeResponse = {
//     user: {
//         id: string;
//         name: string;
//         email?: string | null;
//         avatarUrl?: string | null;
//     };
//     token?: string;
// };

// export default function WindowsXPLogin() {
//     const [code, setCode] = useState("");
//     const [capsOn, setCapsOn] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [focused, setFocused] = useState(false);
//     const [loading, setLoading] = useState(false);

//     const navigate = useNavigate();
//     const location = useLocation();
//     const from = (location.state as any)?.from?.pathname || "/spending";

//     const setAuth = useAuthStore((s) => s.setAuth);

//     const [randomText, setRandomText] = useState(randomString(8));

//     useEffect(() => {
//         const t = setInterval(() => {
//             const len = 6 + Math.floor(Math.random() * 5);
//             setRandomText(randomString(len));
//         }, 750);
//         return () => clearInterval(t);
//     }, []);

//     async function onSubmit(e?: React.FormEvent) {
//         if (e) e.preventDefault();
//         setError(null);
//         if (!code.trim()) {
//             setError("Please enter your login code.");
//             return;
//         }
//         setLoading(true);
//         try {
//             const data = await postJSON<LoginCodeResponse>("/users/login-code", { code: code.trim() });

//             setAuth(
//                 {
//                     id: data.user.id,
//                     name: data.user.name,
//                     email: data.user.email ?? null,
//                     avatarUrl: data.user.avatarUrl ?? null,
//                 },
//                 data.token
//             );
//             toast.success(`Welcome, ${data.user.name}!`);

//             navigate(from, { replace: true });
//         } catch (err: any) {
//             toast.error(err?.message || "Invalid code. Please try again.");
//         } finally {
//             setLoading(false);
//         }
//     }

//     function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
//         setCapsOn((e.getModifierState && e.getModifierState("CapsLock")) || false);
//         if (e.key === "Enter") onSubmit();
//     }

//     const c = useMemo(
//         () => ({
//             blue: "#3a6ea5",
//             blueDark: "#2a4e7c",
//             border: "#1e3c72",
//             winSilver: "#d4d0c8",
//             link: "#0046d5",
//         }),
//         []
//     );
//     const cursor = useBlinkCursor(500);

//     return (
//         // <div className="relative min-h-[100svh] w-screen overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] syne-mono-regular">
//         //     <img src={Bground} alt="background" className="absolute inset-0 h-full w-full object-cover" />
//         //     <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,transparent,rgba(0,0,0,.25))]" />

//         //     <div className="absolute left-1/2 top-1/2 w-[90vw] max-w-[720px] px-4 -translate-x-1/2 -translate-y-1/2">
//         //         <div
//         //             className="rounded-t-xl px-4 py-2 text-white shadow"
//         //             style={{
//         //                 background: "linear-gradient(180deg, #3a6ea5 0%, #2a4e7c 100%)",
//         //                 boxShadow: "0 2px 0 rgba(0,0,0,.15) inset",
//         //             }}
//         //         >
//         //             <div className="flex items-center justify-between">
//         //                 <div className="font-bold tracking-wide">Log On to Kudamine</div>
//         //                 <div className="text-xs opacity-90">
//         //                     <div className="text-xs opacity-90 flex items-center gap-1">
//         //                         <span>{cursor}:</span>
//         //                         <span>Kudamine</span>
//         //                     </div>
//         //                 </div>
//         //             </div>
//         //         </div>

//         //         <div
//         //             className="rounded-b-xl border-x border-b p-6"
//         //             style={{
//         //                 borderColor: c.border,
//         //                 background: "linear-gradient(180deg, rgba(255,255,255,.85) 0%, rgba(240,248,255,.9) 100%)",
//         //             }}
//         //         >
//         //             <div className="mb-5 text-sm text-black/80">
//         //                 <RollingOneChar text="Enter your login code 🔑" tickMs={35} scrambleMs={750} pauseMs={60} />
//         //             </div>

//         //             <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-center gap-5">
//         //                 <div className="flex flex-col items-center">
//         //                     <div
//         //                         className="grid place-items-center h-[88px] w-[88px] rounded-xl border shadow"
//         //                         style={{
//         //                             background: "linear-gradient(180deg, #f8fcff 0%, #dfefff 100%)",
//         //                             borderColor: c.winSilver,
//         //                             boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,.2)",
//         //                         }}
//         //                     >
//         //                         <img
//         //                             alt="user"
//         //                             width={88}
//         //                             height={88}
//         //                             className="h-full w-full object-cover"
//         //                             src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(randomText)}`}
//         //                         />
//         //                     </div>
//         //                     <div className="mt-2 text-black/90" />
//         //                 </div>

//         //                 <form onSubmit={onSubmit} className="space-y-3">
//         //                     <div className="text-xs text-black/70 flex items-center gap-1">
//         //                         <span>Code for:</span>
//         //                         <span className="font-mono text-black">{randomText}</span>
//         //                     </div>

//         //                     <div className="relative max-w-md">
//         //                         <input
//         //                             type="text"
//         //                             inputMode="text"
//         //                             autoCapitalize="none"
//         //                             autoCorrect="off"
//         //                             spellCheck={false}
//         //                             value={code}
//         //                             onChange={(e) => setCode(e.target.value)}
//         //                             onKeyUp={onKey}
//         //                             onFocus={() => setFocused(true)}
//         //                             onBlur={() => setFocused(false)}
//         //                             className="w-full rounded border px-3 py-3 text-[16px] outline-none transition"
//         //                             style={{
//         //                                 borderColor: focused ? c.blue : c.winSilver,
//         //                                 boxShadow: focused ? "0 0 0 2px rgba(58,110,165,.35)" : "inset 0 1px 0 #fff, 0 1px 0 rgba(0,0,0,.05)",
//         //                                 background: "linear-gradient(180deg, #ffffff 0%, #f3f6fb 100%)",
//         //                             }}
//         //                             placeholder="e.g. KDMN-9F2X-7Q..."
//         //                         />
//         //                         {capsOn && <div className="absolute -bottom-6 left-0 text-xs text-red-700">Caps Lock is on.</div>}
//         //                     </div>

//         //                     {error && (
//         //                         <div
//         //                             className="rounded border px-3 py-3 text-sm"
//         //                             style={{ borderColor: "#ffb4b4", background: "#fff5f5", color: "#8c1d18" }}
//         //                         >
//         //                             {error}
//         //                         </div>
//         //                     )}

//         //                     <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
//         //                         <button
//         //                             type="submit"
//         //                             disabled={loading}
//         //                             className="rounded px-4 py-2 text-sm font-semibold text-white shadow w-full sm:w-auto disabled:opacity-70"
//         //                             style={{
//         //                                 background: "linear-gradient(180deg, #4aa52e 0%, #2a7a16 100%)",
//         //                                 boxShadow: "inset 0 1px 0 rgba(255,255,255,.6), 0 1px 2px rgba(0,0,0,.25)",
//         //                             }}
//         //                         >
//         //                             {loading ? "Logging in..." : "Log On"}
//         //                         </button>
//         //                         <button
//         //                             type="button"
//         //                             onClick={() => {
//         //                                 setCode("");
//         //                                 setError(null);
//         //                             }}
//         //                             className="rounded px-4 py-2 text-sm font-semibold text-black/80 w-full sm:w-auto"
//         //                             style={{
//         //                                 background: "linear-gradient(180deg, #ffffff 0%, #e9edf2 100%)",
//         //                                 boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,.15)",
//         //                                 border: `1px solid ${c.winSilver}`,
//         //                             }}
//         //                         >
//         //                             Cancel
//         //                         </button>
//         //                     </div>
//         //                 </form>
//         //             </div>

//         //             <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-black/70">
//         //                 <div className="flex items-center gap-2">
//         //                     <ShutdownButton />
//         //                     <span className="hidden sm:inline">Click Shut Down to turn off the computer.</span>
//         //                 </div>
//         //                 <LangClock />
//         //             </div>
//         //         </div>
//         //     </div>
//         // </div>

//         <a
//   href="https://nam10.safelinks.protection.outlook.com/?url=https%3A%2F%2Flearn.eltngl.com%2F&data=05%7C02%7Canguy114%40bruinmail.slcc.edu%7C88867d42648340e49a1a08de585f91d1%7C0381a94117984cb686deed07c83a7042%7C1%7C0%7C639045364657446354%7CUnknown%7CTWFpbGZsb3d8eyJFbXB0eU1hcGkiOnRydWUsIlYiOiIwLjAuMDAwMCIsIlAiOiJXaW4zMiIsIkFOIjoiTWFpbCIsIldUIjoyfQ%3D%3D%7C0%7C%7C%7C&sdata=VMLNr3J8sQKMdh8U7WPjruvAYRwIttIQg4bd1XmUmp0%3D&reserved=0"
//   target="_blank"
//   rel="noopener noreferrer"
// >
//   👉 book here
// </a>
//     );
// }

// function ShutdownButton() {
//     return (
//         <button
//             className="flex items-center gap-2 rounded-full px-4 py-1.5 text-white shadow"
//             style={{
//                 background: "linear-gradient(180deg, #d34a3d 0%, #a31f16 100%)",
//                 boxShadow: "inset 0 1px 0 rgba(255,255,255,.55), 0 1px 2px rgba(0,0,0,.25)",
//             }}
//             onClick={() => {
//                 window.close();
//                 window.location.href = "https://www.youtube.com/watch?v=QDia3e12czc";
//             }}
//         >
//             <span className="inline-block h-2.5 w-2.5 rounded-full bg-white" />
//             <span className="text-sm font-semibold">Turn off computer</span>
//         </button>
//     );
// }

// function LangClock() {
//     const [now, setNow] = useState(() => new Date());
//     useEffect(() => {
//         const t = setInterval(() => setNow(new Date()), 1000);
//         return () => clearInterval(t);
//     }, []);
//     const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
//     return (
//         <div className="flex items-center gap-3">
//             <div className="rounded border bg-white/60 px-2 py-0.5 text-[11px] shadow" style={{ borderColor: "#d4d0c8" }}>
//                 EN
//             </div>
//             <div className="rounded border bg-white/60 px-2 py-0.5 text-[11px] shadow" style={{ borderColor: "#d4d0c8" }}>
//                 {time}
//             </div>
//         </div>
//     );
// }

import { useEffect, useState } from "react";

export default function WindowsXPLogin() {
    const sections = [
        {
            title: "Can music change your mood from bad to good?",
            data: [
                { label: "Yes", percentage: 75, color: "#6366f1" },
                { label: "No", percentage: 25, color: "#f43f5e" },
            ],
        },
        {
            title: "When you feel sad or tired, what kind of music helps you the most?",
            data: [
                { label: "Chill / Soft", percentage: 35, color: "#6366f1" },
                { label: "Pop", percentage: 30, color: "#06b6d4" },
                { label: "Other", percentage: 25, color: "#a855f7" },
                { label: "Rock", percentage: 10, color: "#f59e0b" },
            ],
        },
        {
            title: "How often do you listen to music to change your mood?",
            data: [
                { label: "Often", percentage: 35, color: "#6366f1" },
                { label: "Always", percentage: 30, color: "#06b6d4" },
                { label: "Sometimes", percentage: 25, color: "#a855f7" },
                { label: "Rarely / Never", percentage: 10, color: "#f43f5e" },
            ],
        },
    ];

    // 🔥 Tăng kích thước tại đây
    const radius = 105;
    const stroke = 30;

    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;

    const [animate, setAnimate] = useState(false);
    const [hovered, setHovered] = useState<number | null>(null);

    useEffect(() => {
        setTimeout(() => setAnimate(true), 200);
    }, []);

    const Donut = ({ sectionIndex }: { sectionIndex: number }) => {
        let cumulativePercent = 0;
        const section = sections[sectionIndex];

        return (
            <div style={{ textAlign: "center" }}>
                <h2
                    style={{
                        marginBottom: "20px",
                        fontSize: "18px",
                        fontWeight: 600,
                    }}
                >
                    {section.title}
                </h2>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "35px",
                    }}
                >
                    {/* Donut */}
                    <div style={{ position: "relative" }}>
                        <svg height={radius * 2} width={radius * 2} style={{ transform: "rotate(-90deg)" }}>
                            {section.data.map((item, index) => {
                                const segment = (item.percentage / 100) * circumference;

                                const strokeDashoffset = (-cumulativePercent / 100) * circumference;

                                cumulativePercent += item.percentage;

                                return (
                                    <circle
                                        key={index}
                                        r={normalizedRadius}
                                        cx={radius}
                                        cy={radius}
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth={hovered === index ? stroke + 5 : stroke}
                                        strokeDasharray={animate ? `${segment} ${circumference}` : `0 ${circumference}`}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        style={{
                                            transition: "all 0.5s ease",
                                            opacity: hovered === null || hovered === index ? 1 : 0.3,
                                        }}
                                    />
                                );
                            })}
                        </svg>

                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "24px",
                                    fontWeight: 700,
                                }}
                            >
                                20
                            </div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#9ca3af",
                                }}
                            >
                                People
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ textAlign: "left" }}>
                        {section.data.map((item, index) => (
                            <div
                                key={index}
                                onMouseEnter={() => setHovered(index)}
                                onMouseLeave={() => setHovered(null)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "14px",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        width: "14px",
                                        height: "14px",
                                        background: item.color,
                                        borderRadius: "50%",
                                        marginRight: "12px",
                                    }}
                                />
                                <div>
                                    <div
                                        style={{
                                            fontSize: "18px",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {item.percentage}%
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#9ca3af",
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                height: "100vh",
                overflow: "hidden",
                background: "radial-gradient(circle at top, #0f172a, #020617)",
                padding: "30px 40px",
                fontFamily: "Inter, sans-serif",
                color: "white",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "50px",
            }}
        >
            <h1
                style={{
                    textAlign: "center",
                    fontSize: "28px",
                    fontWeight: 700,
                }}
            >
                🎵 Music & Mood Survey
            </h1>

            {/* Top */}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <Donut sectionIndex={0} />
            </div>

            {/* Bottom */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-around",
                }}
            >
                <Donut sectionIndex={1} />
                <Donut sectionIndex={2} />
            </div>
        </div>
    );
}

