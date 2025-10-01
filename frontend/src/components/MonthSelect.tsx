// MonthSelect.tsx
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

export function MonthSelect({
    value,
    onChange,
    options,
    placeholder = "Select month",
    className = "",
    density = "compact",
}: {
    value: string;
    onChange: (v: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    density?: "regular" | "compact" | "tiny";
}) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(() =>
        Math.max(
            0,
            options.findIndex((o) => o.value === value)
        )
    );

    const rootRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const current = useMemo(() => options.find((o) => o.value === value), [options, value]);

    // re-sync activeIndex khi options/value đổi
    useEffect(() => {
        const idx = options.findIndex((o) => o.value === value);
        setActiveIndex(Math.max(0, idx));
    }, [options, value]);

    // close on outside click (desktop) + touchstart (mobile)
    useEffect(() => {
        const onDoc = (e: Event) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("touchstart", onDoc, { passive: true });
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("touchstart", onDoc);
        };
    }, []);

    // scroll active option into view when open
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        const el = listRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']")?.[activeIndex];
        el?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    // 🔒 Lock body scroll khi mở (mobile UX)
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const selectAt = (idx: number) => {
        const opt = options[idx];
        if (!opt) return;
        onChange(opt.value);
        setOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
            setOpen(true);
            e.preventDefault();
            return;
        }
        if (!open) return;

        if (e.key === "ArrowDown") {
            setActiveIndex((i) => Math.min(options.length - 1, i + 1));
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            setActiveIndex((i) => Math.max(0, i - 1));
            e.preventDefault();
        } else if (e.key === "Enter") {
            selectAt(activeIndex);
            e.preventDefault();
        } else if (e.key === "Escape") {
            setOpen(false);
            e.preventDefault();
        }
    };

    // size presets (đảm bảo hit-area tối thiểu 44px)
    const preset = {
        regular: {
            trigger: "px-4 py-2 min-h-11 text-sm",
            option: "px-3 py-2 min-h-11 text-sm leading-5",
            menuPad: "p-1",
            optionHeight: "",
        },
        compact: {
            trigger: "px-3 py-2 min-h-11 text-[13px]",
            option: "px-3 py-2 min-h-11 text-[13px] leading-5",
            menuPad: "p-0.5",
            optionHeight: "",
        },
        tiny: {
            trigger: "px-3 py-2 min-h-11 text-xs",
            option: "px-2.5 py-2 min-h-11 text-[12px] leading-4",
            menuPad: "p-0",
            optionHeight: "",
        },
    }[density];

    return (
        <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
            {/* Trigger (full-width trên mobile) */}
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className={`w-full sm:w-auto inline-flex items-center justify-between gap-2 rounded-xl border border-slate-300 dark:border-slate-700
          bg-white dark:bg-slate-900 ${preset.trigger} shadow-sm
          focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors`}
            >
                <span className="truncate max-w-[70vw] sm:max-w-[14rem]">
                    {current ? current.label : <span className="text-slate-400">{placeholder}</span>}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Overlay + Menu (mobile: fixed full-width; desktop: absolute) */}
            {open && (
                <>
                    {/* Overlay giúp dễ bấm ngoài để đóng, nhất là trên mobile */}
                    <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} />
                    <div
                        ref={listRef}
                        role="listbox"
                        tabIndex={-1}
                        // mobile: full-width, dính cạnh; desktop: dropdown
                        className={`
              z-50 sm:absolute sm:mt-2 sm:w-auto
              fixed sm:static
              left-0 right-0 top-[calc(56px+env(safe-area-inset-top))] sm:top-auto
              mx-3 sm:mx-0
              rounded-2xl border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-900 shadow-xl overflow-auto
              max-h-[60vh] sm:max-h-64 ${preset.menuPad}
            `}
                        // auto-focus để bàn phím/scroll tiện hơn điện thoại
                        autoFocus
                    >
                        {options.map((opt, idx) => {
                            const selected = opt.value === value;
                            const active = idx === activeIndex;
                            return (
                                <button
                                    key={opt.value}
                                    role="option"
                                    aria-selected={selected}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onClick={() => selectAt(idx)}
                                    className={`w-full ${preset.option}
                    flex items-center justify-between gap-2
                    ${active ? "bg-slate-100 dark:bg-slate-800" : ""}
                    ${selected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {selected && <Check className="h-4 w-4 flex-none" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
