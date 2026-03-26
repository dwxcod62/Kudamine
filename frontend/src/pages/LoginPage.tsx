import { useEffect, useState } from "react";

/* ================= SETTINGS ================= */

const SETTINGS = {
    intensity: 1.5,

    popup: {
        interval: 200,
        lifetime: 10000,
        max: 30,

        focusInterval: 800,
        focusLifetime: 10000,
        focusMax: 10,
    },

    news: {
        interval: 700,
        lifetime: 5000,
        max: 10,
    },

    chaos: {
        startDelay: 3000,
    },
};

/* ================= DATA ================= */

const englishMessages = [
  "Learn 5 new words today",
  "Practice speaking for 10 minutes",
  "Repeat after native speakers",
  "Watch English videos daily",
  "Write a short paragraph in English",
  "Listen to English podcasts",
  "Read an English article",
  "Practice pronunciation with tongue twisters",
  "Use new words in a sentence",
  "Speak with a language partner",
  "Think in English for 5 minutes",
  "Review yesterday’s vocabulary",
  "Describe your day in English",
  "Learn one idiom today"
];

const spamMessages = [
  "Battery low!",
  "Update available",
  "Storage almost full",
  "Your session expired",
  "New login detected",
  "Click here to claim reward",
  "Limited time offer!",
  "System alert: action required",
  "You have unread notifications",
  "Subscription expiring soon",
  "Security warning!",
  "Unknown device connected",
  "Download failed",
  "Connection unstable"
];

const realNews = [
  "Global markets fluctuate today",
  "Government announces new policy reforms",
  "Scientists discover potential new treatment",
  "Major tech company releases update",
  "Climate change impacts increase globally",
  "New education reforms introduced",
  "Healthcare sector sees major improvements",
  "International summit addresses global issues",
  "Economic growth slows in several regions",
  "Breakthrough in renewable energy technology",
  "New transportation project launched",
  "Unemployment rates show improvement",
  "Researchers publish significant findings",
  "Global trade tensions ease slightly"
];

const fakeNews = [
  "🔥 You won’t believe this!",
  "This trick will change your life forever!",
  "Doctors hate this one secret!",
  "Earn $1000 per day easily!",
  "Miracle cure discovered overnight!",
  "Shocking truth revealed!!!",
  "Click now before it’s gone!",
  "They don’t want you to know this!",
  "Secret method exposed!",
  "Instant results guaranteed!",
  "Unbelievable transformation in 1 day!",
  "Hidden hack finally revealed!",
  "You’ve been doing it wrong!",
  "This will blow your mind!"
];

/* ================= SOLUTIONS ================= */

const solutions = [
    { key: "sources", text: "Choose important sources" },
    { key: "notifications", text: "Turn off notifications" },
    { key: "focus", text: "Focus on one thing at a time" },
];

/* ================= HELPERS ================= */

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function LoginPage() {
    const [popups, setPopups] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [activeSolutions, setActiveSolutions] = useState<string[]>([]);

    const [started, setStarted] = useState(false);
    const [startChaos, setStartChaos] = useState(false);

    const [isSmallScreen, setIsSmallScreen] = useState(false);

    /* ================= SCREEN DETECT ================= */

    useEffect(() => {
        const checkScreen = () => {
            setIsSmallScreen(window.innerWidth < 1400);
        };

        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    /* ================= STATE ================= */

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

    /* ================= RESET POPUPS ================= */

    useEffect(() => {
        setPopups([]);
    }, [isFocus]);

    /* ================= POPUPS ================= */

    useEffect(() => {
        if (!startChaos) return;

        const popupInterval = isFocus ? SETTINGS.popup.focusInterval : SETTINGS.popup.interval;

        const popupLifetime = isFocus ? SETTINGS.popup.focusLifetime : SETTINGS.popup.lifetime;

        const popupMax = isFocus ? SETTINGS.popup.focusMax : isSmallScreen ? 15 : SETTINGS.popup.max;

        const interval = setInterval(() => {
            const isEnglish = isFocus ? true : isNoNoti ? true : Math.random() < 0.7;

            const text = isEnglish
                ? englishMessages[Math.floor(Math.random() * englishMessages.length)]
                : spamMessages[Math.floor(Math.random() * spamMessages.length)];

            const MIN_DISTANCE = isFocus ? 15 : 10;

            let top = rand(10, 80);
            let left = isFocus ? rand(10, 70) : rand(5, 85);

            for (let i = 0; i < 10; i++) {
                const isOverlap = popups.some((p) => {
                    const dx = p.left - left;
                    const dy = p.top - top;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance < MIN_DISTANCE;
                });

                if (!isOverlap) break;

                top = rand(10, 80);
                left = isFocus ? rand(10, 70) : rand(5, 85);
            }

            const popup = {
                id: Math.random(),
                text,
                isEnglish,
                top,
                left,
            };

            setPopups((prev) => [...prev.slice(-popupMax), popup]);

            setTimeout(() => {
                setPopups((prev) => prev.filter((p) => p.id !== popup.id));
            }, popupLifetime);
        }, popupInterval);

        return () => clearInterval(interval);
    }, [startChaos, activeSolutions, isSmallScreen]);

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
            }, SETTINGS.news.lifetime);
        }, SETTINGS.news.interval);

        return () => clearInterval(interval);
    }, [startChaos, activeSolutions]);

    /* ================= UI ================= */

    return (
        <div className="fixed inset-0 bg-[#0f1115] overflow-hidden">
            {/* CHAOS */}
            {startChaos && (
                <>
                    {/* NEWS */}
                    <div className={`absolute inset-0 transition-all duration-500 ${isFocus ? "opacity-10 blur-sm" : ""}`}>
                        {news.map((n) => (
                            <div
                                key={n.id}
                                className="absolute bg-yellow-900/80 text-white p-2 rounded text-sm"
                                style={{
                                    top: `${n.top}vh`,
                                    left: `${n.left}vw`,
                                }}
                            >
                                📰 {n.text}
                            </div>
                        ))}
                    </div>

                    {/* POPUPS */}
                    <div className="absolute inset-0 pointer-events-none">
                        {popups.map((p) => (
                            <div
                                key={p.id}
                                className={`
                                    absolute rounded-2xl transition-all duration-500
                                    ${p.isEnglish ? "bg-emerald-500 text-white" : "bg-[#1a1d24] text-gray-300"}
                                    ${isFocus ? (isSmallScreen ? "text-lg px-6 py-4" : "scale-110 text-2xl px-10 py-6") : "p-3 text-sm"}
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

            {/* START */}
            {!started && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={handleStart} className="px-10 py-5 bg-white rounded-full text-lg text-black hover:scale-105 transition">
                        Start
                    </button>
                </div>
            )}

            {/* MAIN */}
            {started && (
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-10 px-4">
                    {/* TITLE */}
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white/90 text-center">Information Overload</h1>

                    {/* CONTENT */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full max-w-4xl">
                        {/* WHY */}
                        <div className="bg-[#1a1d24] p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl w-full h-full flex flex-col">
                            <p className="text-white text-xl md:text-2xl font-semibold mb-4">WHY?</p>

                            <div className="space-y-3 text-gray-300 text-sm md:text-base flex-1">
                                <p className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg">
                                    😵 <span>Causes stress and tiredness</span>
                                </p>

                                <p className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg">
                                    🎯 <span>Hard to focus on one thing</span>
                                </p>

                                <p className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg">
                                    🧠 <span>Easy to forget important information</span>
                                </p>
                            </div>
                        </div>

                        {/* HOW */}
                        <div className="bg-[#1a1d24] p-6 md:p-8 rounded-3xl border border-white/10 shadow-xl w-full h-full flex flex-col">
                            <p className="text-white text-xl md:text-2xl font-semibold mb-4">HOW?</p>

                            <div className="space-y-3 text-gray-300 text-sm md:text-base flex-1">
                                {solutions.map((s) => {
                                    const iconMap: any = {
                                        sources: "🧹",
                                        notifications: "🔕",
                                        focus: "🎯",
                                    };

                                    return (
                                        <label
                                            key={s.key}
                                            className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 hover:text-white transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={activeSolutions.includes(s.key)}
                                                onChange={() => toggleSolution(s.key)}
                                                className="w-4 h-4 accent-emerald-500"
                                            />

                                            <span className="flex items-center gap-2">
                                                <span>{iconMap[s.key]}</span>
                                                <span>{s.text}</span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
