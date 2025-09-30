import { useEffect, useRef, useState } from "react";

export type RollingOneCharProps = {
    text?: string;
    tickMs?: number;
    scrambleMs?: number;
    pauseMs?: number;
    charClassName?: string;
    className?: string;
};

const lower = "abcdefghijklmnopqrstuvwxyz";
const upper = lower.toUpperCase();

function isLetter(c: string) {
    return lower.includes(c) || upper.includes(c);
}
function alphaOf(c: string) {
    return upper.includes(c) ? upper : lower;
}
function startOf(c: string) {
    return upper.includes(c) ? "A" : "a";
}

/**
 * Hiệu ứng “đếm a..z/A..Z tới ký tự đích” theo từng ký tự, chạy lần lượt từ trái qua phải rồi lặp lại.
 * Có thể tái sử dụng ở bất kỳ trang nào.
 */
export function RollingOneChar({
    text = "",
    tickMs = 35,
    scrambleMs = 420,
    pauseMs = 60,
    charClassName = "rubik-glitch-regular text-xl tracking-wide",
    className,
}: RollingOneCharProps) {
    const target = text.split("");
    const [display, setDisplay] = useState<string[]>(() => [...target]);
    const idxRef = useRef(0);
    const stopRef = useRef(false);

    useEffect(() => {
        stopRef.current = false;
        setDisplay([...target]); // reset theo text hiện tại
        idxRef.current = 0;

        async function loop() {
            while (!stopRef.current) {
                const i = idxRef.current;
                const t = target[i];

                // không phải chữ cái -> bỏ qua (giữ nguyên)
                if (!isLetter(t)) {
                    idxRef.current = (i + 1) % target.length;
                    if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
                    continue;
                }

                const alpha = alphaOf(t);
                const startChar = startOf(t);
                const targetIdx = alpha.indexOf(t);

                if (targetIdx < 0) {
                    idxRef.current = (i + 1) % target.length;
                    if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
                    continue;
                }

                // snapshot nền là các ký tự đích (giữ nguyên các vị trí khác)
                const base = [...target];
                // bắt đầu từ a/A
                let step = 0;
                base[i] = startChar;
                setDisplay(base);

                await new Promise<void>((resolve) => {
                    const startTime = Date.now();
                    const timer = setInterval(() => {
                        if (stopRef.current) {
                            clearInterval(timer);
                            resolve();
                            return;
                        }

                        const elapsed = Date.now() - startTime;
                        // bảo hiểm: nếu tick quá lâu vẫn chốt về ký tự đích
                        if (elapsed >= scrambleMs) {
                            base[i] = t;
                            setDisplay([...base]);
                            clearInterval(timer);
                            resolve();
                            return;
                        }

                        // tăng dần a->b->c... đến ký tự đích
                        const nextIdx = Math.min(step, targetIdx);
                        base[i] = alpha[nextIdx];
                        setDisplay([...base]);

                        if (nextIdx >= targetIdx) {
                            clearInterval(timer);
                            resolve();
                        } else {
                            step += 1;
                        }
                    }, tickMs);
                });

                if (pauseMs > 0) {
                    await new Promise((r) => setTimeout(r, pauseMs));
                }

                // sang ký tự kế tiếp & lặp
                idxRef.current = (i + 1) % target.length;
            }
        }

        loop();

        return () => {
            stopRef.current = true;
        };
    }, [text, tickMs, scrambleMs, pauseMs]);

    return (
        <div className={`flex items-center ${className ?? ""}`}>
            <span className="select-none leading-none">
                {display.map((ch, i) => (
                    <span key={i} className={charClassName}>
                        {ch}
                    </span>
                ))}
            </span>
        </div>
    );
}

export default RollingOneChar;
