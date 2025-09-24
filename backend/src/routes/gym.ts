import { PrismaClient } from "@prisma/client";
import { Router } from "express";
const prisma = new PrismaClient();
const r = Router();

/**
 * @swagger
 * tags:
 *   name: Gym
 *   description: Gym days, focuses, exercises & presets
 */

/**
 * @swagger
 * /gym/days:
 *   get:
 *     tags: [Gym]
 *     summary: List gym days by user and date range
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, example: "2025-09-01" }
 *       - in: query
 *         name: to
 *         schema: { type: string, example: "2025-09-30" }
 *     responses:
 *       200: { description: OK }
 */
r.get("/days", async (req, res) => {
    const { userId, from, to } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const where: any = { userId };
    if (from || to) {
        where.dateYmd = {};
        if (from) where.dateYmd.gte = new Date(from);
        if (to) where.dateYmd.lte = new Date(to);
    }

    const days = await prisma.gymDay.findMany({
        where,
        orderBy: [{ dateYmd: "asc" }],
        include: { focus: true, exercises: true },
    });
    res.json(days);
});

/**
 * @swagger
 * /gym/days:
 *   post:
 *     tags: [Gym]
 *     summary: Create a gym day
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, dateYmd]
 *             properties:
 *               userId: { type: string }
 *               dateYmd: { type: string, example: "2025-09-23" }
 *               note: { type: string }
 *               done: { type: boolean }
 *     responses:
 *       201: { description: Created }
 */

r.post("/days", async (req, res) => {
    const { userId, dateYmd, note, done } = req.body;
    if (!userId || !dateYmd) {
        return res.status(400).json({ message: "userId & dateYmd required" });
    }
    try {
        const day = await prisma.gymDay.create({
            data: {
                userId,
                dateYmd: new Date(dateYmd),
                note,
                done: Boolean(done),
            },
        });
        res.status(201).json(day);
    } catch (e: any) {
        res.status(400).json({ message: e?.message ?? "Create failed" });
    }
});

/**
 * @swagger
 * /gym/days/{id}:
 *   get:
 *     tags: [Gym]
 *     summary: Get a gym day
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.get("/days/:id", async (req, res) => {
    const day = await prisma.gymDay.findUnique({
        where: { id: req.params.id },
        include: { focus: true, exercises: true },
    });
    if (!day) return res.status(404).json({ message: "Not found" });
    res.json(day);
});

/**
 * @swagger
 * /gym/days/{id}:
 *   patch:
 *     tags: [Gym]
 *     summary: Update a gym day
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
 *               note: { type: string }
 *               done: { type: boolean }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.patch("/days/:id", async (req, res) => {
    const { note, done } = req.body as { note?: string; done?: boolean };
    try {
        const updated = await prisma.gymDay.update({
            where: { id: req.params.id },
            data: { note, done, updatedAt: new Date() },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /gym/days/{id}:
 *   delete:
 *     tags: [Gym]
 *     summary: Delete a gym day
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/days/:id", async (req, res) => {
    try {
        await prisma.gymDay.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /gym/days/{id}/focus:
 *   post:
 *     tags: [Gym]
 *     summary: Add focus tags to a day
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
 *             required: [tags]
 *             properties:
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200: { description: OK }
 */

r.post("/days/:id/focus", async (req, res) => {
    const { tags } = req.body as { tags: string[] };
    if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ message: "tags[] required" });
    }
    const dayId = req.params.id;
    const created = await prisma.$transaction(
        tags.map((tag) =>
            prisma.gymDayFocus.upsert({
                where: { dayId_tag: { dayId, tag } },
                update: {},
                create: { dayId, tag },
            })
        )
    );
    res.json(created);
});

/**
 * @swagger
 * /gym/days/{id}/focus/{tag}:
 *   delete:
 *     tags: [Gym]
 *     summary: Remove a focus tag
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: tag
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/days/:id/focus/:tag", async (req, res) => {
    const { id, tag } = req.params;
    try {
        await prisma.gymDayFocus.delete({ where: { dayId_tag: { dayId: id, tag } } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * tags:
 *   name: Exercises
 *   description: exercises & presets
 */

/**
 * @swagger
 * /gym/days/{id}/exercises:
 *   post:
 *     tags: [Exercises]
 *     summary: Add exercises to a day
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
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, sets, reps, weightKg]
 *                   properties:
 *                     name: { type: string }
 *                     sets: { type: integer }
 *                     reps: { type: integer }
 *                     weightKg: { type: number }
 *                     note: { type: string }
 *     responses:
 *       201: { description: Created }
 */

r.post("/days/:id/exercises", async (req, res) => {
    const { items } = req.body as {
        items: { name: string; sets: number; reps: number; weightKg: number; note?: string }[];
    };
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items[] required" });
    const dayId = req.params.id;

    const created = await prisma.$transaction(
        items.map((x) =>
            prisma.gymExercise.create({
                data: {
                    dayId,
                    name: x.name,
                    sets: x.sets,
                    reps: x.reps,
                    weightKg: x.weightKg as any,
                    note: x.note,
                },
            })
        )
    );
    res.status(201).json(created);
});

/**
 * @swagger
 * /gym/exercises/{id}:
 *   patch:
 *     tags: [Exercises]
 *     summary: Update an exercise
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
 *               name: { type: string }
 *               sets: { type: integer }
 *               reps: { type: integer }
 *               weightKg: { type: number }
 *               note: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.patch("/exercises/:id", async (req, res) => {
    const { name, sets, reps, weightKg, note } = req.body;
    try {
        const updated = await prisma.gymExercise.update({
            where: { id: req.params.id },
            data: { name, sets, reps, weightKg: weightKg as any, note },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /gym/exercises/{id}:
 *   delete:
 *     tags: [Exercises]
 *     summary: Delete an exercise
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/exercises/:id", async (req, res) => {
    try {
        await prisma.gymExercise.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /gym/presets:
 *   get:
 *     tags: [Exercises]
 *     summary: List presets by user
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
r.get("/presets", async (req, res) => {
    const { userId } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const presets = await prisma.gymPreset.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
    res.json(presets);
});

/**
 * @swagger
 * /gym/presets:
 *   post:
 *     tags: [Exercises]
 *     summary: Create preset (unique per userId+name)
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, name]
 *             properties:
 *               userId: { type: string }
 *               name: { type: string }
 *     responses:
 *       201: { description: Created }
 */
r.post("/presets", async (req, res) => {
    const { userId, name } = req.body;
    if (!userId || !name) return res.status(400).json({ message: "userId & name required" });
    try {
        const preset = await prisma.gymPreset.create({ data: { userId, name } });
        res.status(201).json(preset);
    } catch (e: any) {
        res.status(400).json({ message: e?.message ?? "Create failed" });
    }
});

/**
 * @swagger
 * /gym/presets/{id}:
 *   delete:
 *     tags: [Exercises]
 *     summary: Delete preset
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/presets/:id", async (req, res) => {
    try {
        await prisma.gymPreset.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

export default r;
