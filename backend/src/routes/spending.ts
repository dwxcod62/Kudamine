import { PrismaClient, SpendingStatus } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Spending
 *   description: Spending templates & monthly entries
 */

/**

/**
 * @swagger
 * /spending/months:
 *   get:
 *     tags: [Spending]
 *     summary: List distinct months (YYYY-MM) for a user
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/months", async (req, res) => {
    let { userId } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });
    userId = String(userId).trim();

    try {
        const rows = await prisma.spendingEntry.groupBy({
            by: ["monthKey"],
            where: { userId },
            _count: { _all: true },
            orderBy: { monthKey: "desc" },
        });

        // rows: [{ monthKey: "2025-09", _count: { _all: 12 } }, ...]
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /spending/templates:
 *   post:
 *     tags: [Spending]
 *     summary: Create template (unique per userId+title)
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title]
 *             properties:
 *               userId: { type: string }
 *               title: { type: string }
 *               defaultAmount: { type: number }
 *               defaultDueDay: { type: integer }
 *     responses:
 *       201: { description: Created }
 */
router.post("/templates", async (req, res) => {
    const { userId, title, defaultAmount, defaultDueDay } = req.body;
    if (!userId || !title) return res.status(400).json({ message: "userId & title required" });
    try {
        const t = await prisma.spendingTemplate.create({
            data: {
                userId,
                title,
                defaultAmount: defaultAmount as any,
                defaultDueDay: defaultDueDay ?? null,
            },
        });
        res.status(201).json(t);
    } catch (e: any) {
        res.status(400).json({ message: e?.message ?? "Create failed" });
    }
});

/**
 * @swagger
 * /spending/templates/{id}:
 *   patch:
 *     tags: [Spending]
 *     summary: Update template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               defaultAmount: { type: number }
 *               defaultDueDay: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.patch("/templates/:id", async (req, res) => {
    const { title, defaultAmount, defaultDueDay } = req.body;
    try {
        const updated = await prisma.spendingTemplate.update({
            where: { id: req.params.id },
            data: {
                title,
                defaultAmount: defaultAmount as any,
                defaultDueDay,
            },
        });
        res.json(updated);
    } catch (e) {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /spending/templates/{id}:
 *   delete:
 *     tags: [Spending]
 *     summary: Delete template
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.delete("/templates/:id", async (req, res) => {
    try {
        await prisma.spendingTemplate.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /spending/entries:
 *   get:
 *     tags: [Spending]
 *     summary: List entries by user (optionally by monthKey)
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: monthKey
 *         schema: { type: string, example: "2025-09" }
 *     responses:
 *       200: { description: OK }
 */
router.get("/entries", async (req, res) => {
    const { userId, monthKey } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const entries = await prisma.spendingEntry.findMany({
        where: { userId, monthKey: monthKey || undefined },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
    res.json(entries);
});

/**
 * @swagger
 * /spending/entries:
 *   get:
 *     tags: [Spending]
 *     summary: List entries by user (optionally filter by monthKey), sorted by monthKey desc then dueDate asc
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: monthKey
 *         description: Filter by month key (YYYY-MM)
 *         schema: { type: string, example: "2025-09" }
 *     responses:
 *       200: { description: OK }
 */
router.get("/entries", async (req, res) => {
    let { userId, monthKey } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });

    userId = String(userId).trim();
    monthKey = monthKey ? String(monthKey).trim() : undefined;

    // validate monthKey nếu có
    if (monthKey && !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) {
        return res.status(400).json({ message: "monthKey phải dạng YYYY-MM" });
    }

    try {
        const entries = await prisma.spendingEntry.findMany({
            where: {
                userId,
                monthKey: monthKey ?? undefined, // nếu không truyền thì không lọc
            },
            orderBy: [
                { monthKey: "desc" }, // tháng mới trước
                { dueDate: "asc" }, // trong tháng: ngày sớm trước
                { createdAt: "desc" }, // cùng ngày: mới tạo trước
            ],
        });

        // Decimal -> number cho FE
        const normalized = entries.map((e) => ({
            ...e,
            amount: Number(e.amount),
        }));

        res.json(normalized);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @swagger
 * /spending/entries/{id}:
 *   patch:
 *     tags: [Spending]
 *     summary: Update a spending entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               dueDate: { type: string }
 *               amount: { type: number }
 *               status:
 *                 type: string
 *                 enum: [Done, Process, Skip]
 *               monthKey: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.patch("/entries/:id", async (req, res) => {
    const { title, dueDate, amount, status, monthKey } = req.body as {
        title?: string;
        dueDate?: string;
        amount?: number | string;
        status?: SpendingStatus;
        monthKey?: string;
    };
    try {
        const updated = await prisma.spendingEntry.update({
            where: { id: req.params.id },
            data: {
                title,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                amount: amount as any,
                status,
                monthKey,
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /spending/entries/{id}:
 *   delete:
 *     tags: [Spending]
 *     summary: Delete a spending entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.delete("/entries/:id", async (req, res) => {
    try {
        await prisma.spendingEntry.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

export default router;
