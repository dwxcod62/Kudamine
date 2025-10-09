import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const timetable = Router();

function getUserId(req: any): string {
    const h = (req.headers["x-user-id"] as string) || "";
    const b = (req.body?.userId as string) || "";
    const q = (req.query?.userId as string) || "";
    return h || b || q || "demo-user";
}

function parseDateYmd(s: string): Date {
    const d = new Date(s + "T00:00:00.000Z");
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date format");
    return d;
}
function mondayOf(d: Date): Date {
    const x = new Date(d);
    const day = x.getUTCDay();
    const offset = (day + 6) % 7;
    x.setUTCDate(x.getUTCDate() - offset);
    x.setUTCHours(0, 0, 0, 0);
    return x;
}

function todayUtc(): Date {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0);
    return t;
}

/* ========================= TAGS ========================= */

/**
 * @swagger
 * tags:
 *   name: Timetable
 *   description: Weekly timetable (tags & events)
 */

/**
 * @swagger
 * /tt/tags:
 *   get:
 *     tags: [Timetable]
 *     summary: List user tags
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimetableTag'
 */
timetable.get("/tags", async (req, res) => {
    const userId = getUserId(req);
    const tags = await prisma.timetableTag.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
    res.json(tags);
});

/**
 * @swagger
 * /tt/tags:
 *   post:
 *     tags: [Timetable]
 *     summary: Create a tag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimetableTagCreate'
 *     responses:
 *       201: { description: Created }
 *       409: { description: Duplicate tag name }
 */
timetable.post("/tags", async (req, res) => {
    const userId = getUserId(req);
    const { name, color } = req.body ?? {};
    if (!name || !color) return res.status(400).json({ message: "name & color are required" });
    try {
        const tag = await prisma.timetableTag.create({
            data: { userId, name, color },
        });
        res.status(201).json(tag);
    } catch (e: any) {
        // trùng (userId, name)
        return res.status(409).json({ message: "Tag name already exists" });
    }
});

/**
 * @swagger
 * /tt/tags/{id}:
 *   patch:
 *     tags: [Timetable]
 *     summary: Update a tag (name/color)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimetableTagUpdate'
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *       409: { description: Duplicate tag name }
 */
timetable.patch("/tags/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, color } = req.body ?? {};
    try {
        const tag = await prisma.timetableTag.update({
            where: { id },
            data: {
                ...(name ? { name } : {}),
                ...(color ? { color } : {}),
                updatedAt: new Date(),
            },
        });
        if (tag.userId !== userId) return res.status(404).json({ message: "Not found" });
        res.json(tag);
    } catch (e: any) {
        const msg = (e?.meta?.cause as string) || "";
        if (/Unique constraint/.test(msg)) return res.status(409).json({ message: "Tag name already exists" });
        return res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /tt/tags/{id}:
 *   delete:
 *     tags: [Timetable]
 *     summary: Delete a tag (events keep tagId=null)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       204: { description: No Content }
 *       404: { description: Not found }
 */
timetable.delete("/tags/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    try {
        const tag = await prisma.timetableTag.delete({ where: { id } });
        if (tag.userId !== userId) return res.status(404).json({ message: "Not found" });
        res.status(204).end();
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/* ========================= EVENTS ========================= */

/**
 * @swagger
 * /tt/events:
 *   get:
 *     tags: [Timetable]
 *     summary: List events for a week
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema: { type: string, example: "2025-10-06" }
 *         description: ISO date (Monday of the week). If a date in the week is given, server will normalize to Monday.
 *       - in: query
 *         name: includeExpired
 *         schema: { type: boolean, default: false }
 *         description: If true, include events with endDate <= today
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimetableEventWithTag'
 */
timetable.get("/events", async (req, res) => {
    const userId = getUserId(req);

    const raw = String(req.query.weekStart || "");
    if (!raw) return res.status(400).json({ message: "weekStart is required (YYYY-MM-DD)" });
    let wk = parseDateYmd(raw);
    wk = mondayOf(wk);

    const includeExpired = String(req.query.includeExpired || "false") === "true";
    const today = todayUtc();

    const whereExpired = includeExpired ? {} : { OR: [{ endDate: null }, { endDate: { gt: today } }] };

    const events = await prisma.timetableEvent.findMany({
        where: {
            userId,
            weekStart: wk,
            ...whereExpired,
        },
        orderBy: [{ day: "asc" }, { startMin: "asc" }],
        include: { tag: true },
    });

    res.json(events);
});

/**
 * @swagger
 * /tt/events:
 *   post:
 *     tags: [Timetable]
 *     summary: Create an event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimetableEventCreate'
 *     responses:
 *       201: { description: Created }
 *       400: { description: Bad request }
 */
timetable.post("/events", async (req, res) => {
    const userId = getUserId(req);
    const { title, weekStart, day, startMin, duration, status, tagId, color, endDate } = req.body ?? {};

    if (!title || weekStart == null || day == null || startMin == null || duration == null) {
        return res.status(400).json({ message: "title, weekStart, day, startMin, duration are required" });
    }

    let wk = parseDateYmd(String(weekStart));
    wk = mondayOf(wk);

    let end: Date | null = null;
    if (endDate) {
        end = parseDateYmd(String(endDate));
    } else {
        // default: hết hạn sau 7 ngày tính từ weekStart
        end = new Date(wk);
        end.setUTCDate(end.getUTCDate() + 7);
    }

    if (day < 0 || day > 6) return res.status(400).json({ message: "day must be 0..6" });
    if (startMin < 0 || startMin >= 24 * 60) return res.status(400).json({ message: "startMin out of range" });
    if (duration <= 0) return res.status(400).json({ message: "duration must be > 0" });
    if (end && end < wk) return res.status(400).json({ message: "endDate must be >= weekStart" });

    const data = await prisma.timetableEvent.create({
        data: {
            userId,
            title,
            weekStart: wk,
            day,
            startMin,
            duration,
            status,
            tagId: tagId ?? null,
            color: color ?? null,
            endDate: end,
        },
        include: { tag: true },
    });

    res.status(201).json(data);
});

/**
 * @swagger
 * /tt/events/{id}:
 *   patch:
 *     tags: [Timetable]
 *     summary: Update an event
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TimetableEventUpdate'
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
timetable.patch("/events/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;

    const { title, weekStart, day, startMin, duration, status, tagId, color, endDate } = req.body ?? {};

    // Validate một số field nếu gửi lên
    let wk: Date | undefined;
    if (weekStart !== undefined) {
        wk = mondayOf(parseDateYmd(String(weekStart)));
    }
    let end: Date | null | undefined;
    if (endDate !== undefined) {
        end = endDate === null ? null : parseDateYmd(String(endDate));
    }

    try {
        // Chỉ update các field có gửi
        const updated = await prisma.timetableEvent.update({
            where: { id },
            data: {
                ...(title !== undefined ? { title } : {}),
                ...(wk !== undefined ? { weekStart: wk } : {}),
                ...(day !== undefined ? { day } : {}),
                ...(startMin !== undefined ? { startMin } : {}),
                ...(duration !== undefined ? { duration } : {}),
                ...(status !== undefined ? { status } : {}),
                ...(tagId !== undefined ? { tagId } : {}),
                ...(color !== undefined ? { color } : {}),
                ...(end !== undefined ? { endDate: end } : {}),
                updatedAt: new Date(),
            },
            include: { tag: true },
        });

        if (updated.userId !== userId) return res.status(404).json({ message: "Not found" });

        // Ràng buộc hợp lệ đơn giản:
        if (updated.endDate && updated.endDate < updated.weekStart) {
            // rollback tối giản (tuỳ bạn muốn strict hơn thì validate trước khi update)
            // Ở đây trả 400 và gợi ý client sửa.
            return res.status(400).json({ message: "endDate must be >= weekStart" });
        }

        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /tt/events/{id}:
 *   delete:
 *     tags: [Timetable]
 *     summary: Delete an event
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       204: { description: No Content }
 *       404: { description: Not found }
 */
timetable.delete("/events/:id", async (req, res) => {
    const userId = getUserId(req);
    const { id } = req.params;
    try {
        const ev = await prisma.timetableEvent.delete({ where: { id } });
        if (ev.userId !== userId) return res.status(404).json({ message: "Not found" });
        res.status(204).end();
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

export default timetable;
