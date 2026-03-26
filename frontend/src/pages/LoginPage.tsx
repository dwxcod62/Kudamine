import { useEffect, useState } from "react";

/* ================= SETTINGS ================= */

const SETTINGS = {
    intensity: 1.5,

    popup: {
        interval: 200,
        lifetime: 10000,
        max: 30,

        // 👇 focus mode
        focusInterval: 1200,
        focusLifetime: 8000,
        focusMax: 2,
    },

    news: {
        interval: 700,
        lifetime: 5000,
        max: 10,
    },

    chaos: {
        startDelay: 10000,
    },
};

/* ================= DATA ================= */

const englishMessages = ["Learn 5 new words today", "Practice speaking for 10 minutes", "Repeat after native speakers", "Watch English videos daily"];

const spamMessages = ["Battery low!", "Update available", "Storage almost full"];

const realNews = ["Global markets fluctuate today"];
const fakeNews = ["🔥 You won’t believe this!"];

/* ================= SOLUTIONS ================= */

const solutions = [
    { key: "sources", text: "Choose important sources" },
    { key: "notifications", text: "Turn off notifications" },
    { key: "focus", text: "Focus on one thing at a time" },
];

/* ================= HELPERS ================= */

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const scale = (v: number) => v / SETTINGS.intensity;

/* ================= COMPONENT ================= */

export default function DashboardPage() {
    const [popups, setPopups] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [activeSolutions, setActiveSolutions] = useState<string[]>([]);

    const [started, setStarted] = useState(false);
    const [startChaos, setStartChaos] = useState(false);

    const toggleSolution = (key: string) => {
        setActiveSolutions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    const isFocus = activeSolutions.includes("focus");
    const isFilter = activeSolutions.includes("sources");
    const isNoNoti = activeSolutions.includes("notifications");

    const handleStart = () => {
        setStarted(true);
        setTimeout(() => setStartChaos(true), SETTINGS.chaos.startDelay);
    };

    /* ================= CLEAR POPUPS WHEN SWITCH MODE ================= */

    useEffect(() => {
        setPopups([]); // reset khi đổi mode
    }, [isFocus]);

    /* ================= POPUPS ================= */

    useEffect(() => {
        if (!startChaos) return;

        const popupInterval = isFocus ? SETTINGS.popup.focusInterval : scale(SETTINGS.popup.interval);

        const popupLifetime = isFocus ? SETTINGS.popup.focusLifetime : scale(SETTINGS.popup.lifetime);

        const popupMax = isFocus ? SETTINGS.popup.focusMax : SETTINGS.popup.max;

        const interval = setInterval(() => {
            const isEnglish = isFocus ? true : isNoNoti ? true : Math.random() < 0.7;

            const text = isEnglish
                ? englishMessages[Math.floor(Math.random() * englishMessages.length)]
                : spamMessages[Math.floor(Math.random() * spamMessages.length)];

            const popup = {
                id: Math.random(),
                text,
                isEnglish,
                top: rand(10, 80),
                left: isFocus ? rand(30, 70) : rand(5, 85),
            };

            setPopups((prev) => [...prev.slice(-popupMax), popup]);

            setTimeout(() => {
                setPopups((prev) => prev.filter((p) => p.id !== popup.id));
            }, popupLifetime);
        }, popupInterval);

        return () => clearInterval(interval);
    }, [startChaos, activeSolutions]);

    /* ================= NEWS ================= */

    useEffect(() => {
        if (!startChaos || isFocus) return;

        const interval = setInterval(() => {
            const pool = isFilter ? realNews : [...realNews, ...fakeNews];

            const item = {
                id: Math.random(),
                text: pool[Math.floor(Math.random() * pool.length)],
                top: rand(5, 85),
                left: rand(5, 85),
            };

            setNews((prev) => [...prev.slice(-10), item]);

            setTimeout(() => {
                setNews((prev) => prev.filter((n) => n.id !== item.id));
            }, scale(SETTINGS.news.lifetime));
        }, scale(SETTINGS.news.interval));

        return () => clearInterval(interval);
    }, [startChaos, activeSolutions]);

    /* ================= UI ================= */

    return (
        <div className="relative min-h-screen bg-[#0f1115] overflow-hidden">
            {startChaos && (
                <>
                    {/* ===== BACKGROUND ===== */}
                    <div className={`absolute inset-0 z-[1] transition-all duration-500 ${isFocus ? "opacity-10 blur-sm" : ""}`}>
                        {news.map((n) => (
                            <div
                                key={n.id}
                                className="absolute bg-yellow-900/80 text-white p-2 rounded"
                                style={{
                                    top: `${n.top}vh`,
                                    left: `${n.left}vw`,
                                }}
                            >
                                📰 {n.text}
                            </div>
                        ))}
                    </div>

                    {/* ===== POPUP ===== */}
                    <div className="absolute inset-0 z-[5] pointer-events-none">
                        {popups.map((p) => (
                            <div
                                key={p.id}
                                className={`
                                    absolute rounded-2xl transition-all duration-700 ease-out
                                    
                                    ${p.isEnglish ? "bg-emerald-500 text-white" : "bg-[#1a1d24] text-gray-300"}

                                    ${isFocus ? "scale-150 text-2xl font-semibold px-10 py-6 shadow-[0_0_60px_rgba(16,185,129,1)]" : "p-4"}

                                    ${isFocus && !p.isEnglish ? "hidden" : ""}
                                `}
                                style={{
                                    top: `${p.top}vh`,
                                    left: `${p.left}vw`,
                                }}
                            >
                                🔔 {p.text}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ===== START ===== */}
            {!started && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={handleStart} className="px-12 py-6 bg-white rounded-full text-xl text-black hover:scale-105 transition">
                        Start
                    </button>
                </div>
            )}

            {/* ===== MAIN CONTENT ===== */}
            {started && (
                <div className="relative z-[10] flex flex-col items-center justify-center min-h-screen gap-12">
                    <h1 className="text-5xl text-white/80">Information Overload</h1>

                    <div className="flex gap-16">
                        {/* WHY */}
                        <div className="bg-[#1a1d24] p-8 rounded-2xl text-lg">
                            <p className="text-white text-2xl mb-4">WHY</p>
                            <p className="text-gray-400">• Reduces concentration</p>
                            <p className="text-gray-400">• Causes stress</p>
                            <p className="text-gray-400">• Harder decisions</p>
                        </div>

                        {/* SOLUTION */}
                        <div className="bg-[#1a1d24] p-8 rounded-2xl text-lg">
                            <p className="text-white text-2xl mb-4">SOLUTION</p>

                            {solutions.map((s) => (
                                <label key={s.key} className="block mb-3">
                                    <input type="checkbox" checked={activeSolutions.includes(s.key)} onChange={() => toggleSolution(s.key)} />{" "}
                                    {s.text}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
