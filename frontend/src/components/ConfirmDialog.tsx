import { X } from "lucide-react";

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                    <button onClick={onCancel} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
                {/* body */}
                <div className="px-4 py-5 text-sm text-gray-600 dark:text-gray-300">{message}</div>
                {/* actions */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/40 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        {cancelLabel}
                    </button>
                    <button onClick={onConfirm} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700">
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
