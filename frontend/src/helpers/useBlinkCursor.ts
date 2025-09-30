import { useEffect, useState } from "react";

export function useBlinkCursor(interval = 500) {
    const [showGt, setShowGt] = useState(true);

    useEffect(() => {
        const t = setInterval(() => {
            setShowGt((prev) => !prev);
        }, interval);
        return () => clearInterval(t);
    }, [interval]);

    return showGt ? ">" : "_";
}
