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
 * @swagger
 * /spending/templates:
 *   get:
 *     tags: [Spending]
 *     summary: List templates by user
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/templates", async (req, res) => {
    const { userId } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const items = await prisma.spendingTemplate.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
    res.json(items);
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
 *   post:
 *     tags: [Spending]
 *     summary: Create a spending entry
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, title, dueDate, amount, monthKey]
 *             properties:
 *               userId: { type: string }
 *               templateId: { type: string }
 *               title: { type: string }
 *               dueDate: { type: string, example: "2025-09-22" }
 *               amount: { type: number }
 *               status:
 *                 type: string
 *                 enum: [Done, Process, Skip]
 *               monthKey: { type: string, example: "2025-09" }
 *     responses:
 *       201: { description: Created }
 */
router.post("/entries", async (req, res) => {
    const { userId, templateId, title, dueDate, amount, status, monthKey } = req.body as {
        userId: string;
        templateId?: string;
        title: string;
        dueDate: string;
        amount: number | string;
        status?: SpendingStatus;
        monthKey: string;
    };
    if (!userId || !title || !dueDate || !amount || !monthKey) {
        return res.status(400).json({ message: "userId, title, dueDate, amount, monthKey required" });
    }
    const created = await prisma.spendingEntry.create({
        data: {
            userId,
            templateId: templateId ?? null,
            title,
            dueDate: new Date(dueDate),
            amount: amount as any,
            status: status ?? "Process",
            monthKey,
        },
    });
    res.status(201).json(created);
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
