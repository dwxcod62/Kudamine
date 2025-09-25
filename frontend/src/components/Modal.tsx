import { X } from "lucide-react";
import { useEffect } from "react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    widthClass?: string;
};

export function Modal({ open, onClose, title, children, footer, widthClass = "max-w-lg" }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                className={`relative w-[92vw] ${widthClass} rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl 
                    dark:border-gray-800 dark:bg-gray-900`}
            >
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <button
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="space-y-4">{children}</div>
                {footer && <div className="mt-4 flex items-center justify-end gap-2">{footer}</div>}
            </div>
        </div>
    );
}
