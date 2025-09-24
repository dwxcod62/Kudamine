// import noIdeal from "../assets/no-ideal.jpg";

// export function EmptyState({ title }: { title: string }) {
//     return (
//         <div className="box p-10 empty bg-white dark:bg-slate-900 flex flex-col items-center text-center">
//             <img src={noIdeal} alt="Empty" className="w-128 h-128 object-contain mb-6 opacity-80" />
//             <div className="text-2xl font-bold mb-2">{title}</div>
//             <p className="text-slate-500">No content yet. This page is a stub waiting for real data.</p>
//         </div>
//     );
// }

// export default EmptyState;

import { Link } from "react-router-dom";
import fallbackImg from "../assets/no-ideal.jpg"; // đổi sang ảnh của bạn nếu muốn

type Props = {
    code?: string; // "404" | "Empty"...
    title?: string; // dòng mô tả ngắn
    caption?: string; // caption nhỏ ở đáy
    bgSrc?: string; // URL ảnh nền
    primaryHref?: string; // nút trái: về nhà
    primaryText?: string;
    secondaryHref?: string; // nút phải: tiếp tục khám phá
    secondaryText?: string;
};

export default function EmptyState({
    code = "404",
    title = "We’re sorry. We can’t connect to the outer reaches of the web right now.",
    caption = "Head home or enjoy the view?",
    bgSrc,
    primaryHref = "/",
    primaryText = "Home",
    secondaryHref = "/spending",
    secondaryText = "Back to app",
}: Props) {
    return (
        <div className="min-h-[80vh] grid place-items-center p-6 bg-[var(--bg-page)]">
            <div className="relative w-full max-w-4xl aspect-[16/9] rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl">
                {/* Background image */}
                <img src={bgSrc || fallbackImg} alt="Scenic" className="absolute inset-0 h-full w-full object-cover" />

                {/* Soft vignette + gradient bottom */}
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Big code at top-right */}
                <div className="absolute top-4 right-6 text-7xl md:text-8xl font-bold tracking-[0.2em] text-white/30 select-none">{code}</div>

                {/* Bottom content bar (like the shot) */}
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-[13px] md:text-sm font-mono text-zinc-300 flex flex-col gap-4">
                    {/* Title / message */}
                    <p className="text-zinc-200/90">{title}</p>

                    {/* Actions + tiny caption row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-zinc-400">{caption}</span>
                        <div className="flex items-center gap-2">
                            <Link
                                to={primaryHref}
                                className="inline-flex items-center rounded-xl px-4 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition"
                            >
                                {primaryText}
                            </Link>
                            <Link
                                to={secondaryHref}
                                className="inline-flex items-center rounded-xl px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:brightness-110 transition"
                            >
                                {secondaryText}
                            </Link>
                        </div>
                    </div>

                    {/* tiny bottom line (like credits) */}
                    <div className="flex items-center justify-between text-[12px] text-zinc-500/90">
                        <span>web • product • brand</span>
                        <span>© {new Date().getFullYear()} your.brand</span>
                    </div>
                </div>

                {/* Subtle outer shadow glow */}
                <div className="pointer-events-none absolute -inset-1 rounded-[inherit] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]"></div>
            </div>
        </div>
    );
}
