import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

export function MonthSelect({
    value,
    onChange,
    options,
    placeholder = "Select month",
    className = "",
}: {
    value: string;
    onChange: (v: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
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

    // close on outside click
    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    // scroll active option into view when open
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        const el = listRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']")?.[activeIndex];
        el?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

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

    return (
        <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
            {/* Trigger */}
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-2 text-sm shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
                <span className="truncate max-w-[14rem]">{current ? current.label : <span className="text-slate-400">{placeholder}</span>}</span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    ref={listRef}
                    role="listbox"
                    tabIndex={-1}
                    className="absolute z-50 mt-2 w-[min(20rem,90vw)] rounded-xl border border-slate-200 dark:border-slate-700
                     bg-white dark:bg-slate-900 shadow-lg overflow-auto max-h-72 p-1"
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
                                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm
                            ${active ? "bg-slate-100 dark:bg-slate-800" : ""}
                            ${selected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {selected && <Check className="h-4 w-4" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
