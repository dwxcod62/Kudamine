export type SpendingStatus = "Done" | "Process" | "Skip";

export type SpendingEntry = {
    id: string;
    userId: string;
    templateId?: string | null;
    title: string;
    dueDate: string;
    amount: number;
    status: SpendingStatus;
    monthKey: string;
    createdAt: string;
    updatedAt: string;
};

export async function listEntries(userId: string, monthKey?: string) {
    const qs = new URLSearchParams({ userId });
    if (monthKey) qs.set("monthKey", monthKey);
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/spending/entries?` + qs.toString());
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as SpendingEntry[];
    return data;
}

export async function updateEntryStatus(id: string, status: SpendingStatus) {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/spending/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as SpendingEntry;
    return data;
}

export async function deleteEntry(id: string) {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/spending/entries/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}
