import { useEffect, useRef, useState } from "react";

const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function ScrambleText({
    text,
    duration = 420, // thời gian mỗi ký tự chạy (ms)
    stagger = 70, // trễ giữa các ký tự (ms)
    speed = 30, // bước khung hình (ms)
    className = "",
}: {
    text: string;
    duration?: number;
    stagger?: number;
    speed?: number;
    className?: string;
}) {
    const [out, setOut] = useState<string[]>(() => text.split(""));
    const startsRef = useRef<number[]>([]);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const chars = text.split("");
        setOut(chars);

        // đặt thời điểm bắt đầu cho từng ký tự (có stagger)
        const base = performance.now();
        startsRef.current = chars.map((c, i) => (c === " " ? -1 : base + i * stagger));

        const loop = (now: number) => {
            let active = false;
            const next = [...chars];

            for (let i = 0; i < chars.length; i++) {
                const start = startsRef.current[i];
                if (start < 0) {
                    // khoảng trắng hoặc ký tự không cần animate
                    next[i] = chars[i];
                    continue;
                }
                const t = now - start;
                if (t < 0) {
                    // chưa đến lượt
                    active = true;
                    next[i] = " ";
                } else if (t < duration) {
                    // đang chạy ngẫu nhiên
                    active = true;
                    next[i] = AZ[(Math.random() * AZ.length) | 0];
                } else {
                    // kết thúc -> chốt ký tự đúng
                    next[i] = chars[i];
                }
            }

            setOut(next);
            if (active) {
                rafRef.current = window.setTimeout(() => {
                    requestAnimationFrame(loop);
                }, speed) as unknown as number;
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(loop) as unknown as number;

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [text, duration, stagger, speed]);

    return <span className={className}>{out.join("")}</span>;
}

/* ================== Your page ================== */

export default function LoginPage() {
    return <InputField />;
}

export function InputField() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="rounded-xl border-4 border-black bg-white p-8 shadow-lg relative">
                {/* Dùng ScrambleText thay cho h2 */}
                <h2 className="text-2xl font-bold text-center mb-6">
                    <ScrambleText text="Input Field" duration={450} stagger={80} speed={24} />
                </h2>

                {/* Password Field */}
                <div className="mb-6 flex justify-center">
                    <input
                        type="password"
                        placeholder="What's up!"
                        className="w-72 rounded-full bg-black text-white tracking-[0.5em] text-center py-3 font-mono placeholder:text-white/50 focus:outline-none"
                    />
                </div>

                {/* Button */}
                <div className="text-center">
                    <button className="rounded-full border-2 border-black px-6 py-2 font-semibold hover:bg-black hover:text-white transition">
                        Join!!
                    </button>
                </div>
            </div>
        </div>
    );
}
