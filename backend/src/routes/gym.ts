import type { $Enums } from "@prisma/client";
import { MuscleDetailed as MuscleDetailedEnum, PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const r = Router();

type MuscleDetailed = $Enums.MuscleDetailed;
const MUSCLE_DETAILED = Object.values(MuscleDetailedEnum) as MuscleDetailed[];

function isMuscleDetailed(v: any): v is MuscleDetailed {
    return MUSCLE_DETAILED.includes(v);
}

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
        include: {
            focus: true,
            exercises: {
                include: { preset: true },
            },
        },
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
        include: { focus: true, exercises: { include: { preset: true } } },
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
        items: { presetId?: string; name?: string; sets: number; reps: number; weightKg: number; note?: string }[];
    };
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items[] required" });
    const dayId = req.params.id;

    try {
        const prepared = await Promise.all(
            items.map(async (x) => {
                if (!Number.isInteger(x.sets) || !Number.isInteger(x.reps) || typeof x.weightKg !== "number") {
                    throw { status: 400, message: "invalid item: sets,reps,weightKg required" };
                }

                let presetId = x.presetId;
                if (!presetId) {
                    if (!x.name) throw { status: 400, message: "each item must provide presetId or name" };
                    const preset = await prisma.gymPreset.findUnique({ where: { name: x.name } });
                    if (!preset) throw { status: 400, message: `preset not found: ${x.name}` };
                    presetId = preset.id;
                } else {
                    const exists = await prisma.gymPreset.findUnique({ where: { id: presetId }, select: { id: true } });
                    if (!exists) throw { status: 400, message: `presetId not found: ${presetId}` };
                }

                return {
                    dayId,
                    presetId,
                    sets: x.sets,
                    reps: x.reps,
                    weightKg: x.weightKg as any,
                    note: x.note,
                };
            })
        );

        const created = await prisma.$transaction(
            prepared.map((data) =>
                prisma.gymExercise.create({
                    data,
                })
            )
        );

        const createdWithPreset = await Promise.all(
            created.map((c) =>
                prisma.gymExercise.findUnique({
                    where: { id: c.id },
                    include: { preset: true },
                })
            )
        );

        res.status(201).json(createdWithPreset);
    } catch (e: any) {
        if (e?.status) return res.status(e.status).json({ message: e.message });
        res.status(400).json({ message: e?.message ?? "Create failed" });
    }
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
    const { presetId, name, sets, reps, weightKg, note } = req.body as {
        presetId?: string;
        name?: string;
        sets?: number;
        reps?: number;
        weightKg?: number;
        note?: string;
    };

    const data: any = { updatedAt: new Date() };

    try {
        if (presetId) {
            const p = await prisma.gymPreset.findUnique({ where: { id: presetId }, select: { id: true } });
            if (!p) return res.status(400).json({ message: "presetId not found" });
            data.presetId = presetId;
        } else if (name) {
            const p = await prisma.gymPreset.findUnique({ where: { name } });
            if (!p) return res.status(400).json({ message: "preset name not found" });
            data.presetId = p.id;
        }

        if (Number.isInteger(sets)) data.sets = sets;
        if (Number.isInteger(reps)) data.reps = reps;
        if (weightKg !== undefined) data.weightKg = weightKg as any;
        if (note !== undefined) data.note = note;

        const updated = await prisma.gymExercise.update({
            where: { id: req.params.id },
            data,
            include: { preset: true },
        });
        res.json(updated);
    } catch (e: any) {
        if (e?.code === "P2025") return res.status(404).json({ message: "Not found" });
        res.status(400).json({ message: e?.message ?? "Update failed" });
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
 *     summary: List presets
 *     parameters:
 *       - in: query
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
r.get("/presets", async (req, res) => {
    const { detail } = req.query as any;

    if (detail && !isMuscleDetailed(detail)) {
        return res.status(400).json({ message: "invalid detail" });
    }

    const presets = await prisma.gymPreset.findMany({
        where: detail
            ? {
                  targets: {
                      some: { detail: detail as MuscleDetailed },
                  },
              }
            : undefined,
        orderBy: { name: "asc" },
        include: { targets: true },
    });

    res.json(presets);
});

/**
 * @swagger
 * /gym/presets:
 *   post:
 *     tags: [Exercises]
 *     summary: Create preset (unique per userId+name)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, name, imageUrl, instructions]
 *             properties:
 *               userId: { type: string }
 *               name: { type: string }
 *               imageUrl: { type: string }
 *               instructions: { type: string }
 *               targets:
 *                 type: array
 *                 items: { type: string, example: "Quads" }
 *     responses:
 *       201: { description: Created }
 */
r.post("/presets", async (req, res) => {
    const { name, imageUrl, instructions, targets } = req.body as {
        name?: string;
        imageUrl?: string;
        instructions?: string;
        targets?: string[];
    };
    if (!name || !imageUrl || !instructions) {
        return res.status(400).json({ message: "userId, name, imageUrl, instructions required" });
    }
    if (targets && (!Array.isArray(targets) || targets.some((t) => !isMuscleDetailed(t)))) {
        return res.status(400).json({ message: "invalid targets[]" });
    }
    try {
        const preset = await prisma.gymPreset.create({
            data: {
                name,
                imageUrl,
                instructions,
                targets: targets?.length ? { create: targets.map((detail) => ({ detail: detail as MuscleDetailed })) } : undefined,
            },
            include: { targets: true },
        });
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

/**
 * @swagger
 * /gym/muscles/detailed:
 *   get:
 *     tags: [Exercises]
 *     summary: List all MuscleDetailed options
 *     responses:
 *       200: { description: OK }
 */
r.get("/muscles/detailed", (_req, res) => {
    res.json(MUSCLE_DETAILED);
});

export default r;

/**
 * @swagger
 * /gym/presets/{id}:
 *   get:
 *     tags: [Exercises]
 *     summary: Get a preset (include targets)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.get("/presets/:id", async (req, res) => {
    const preset = await prisma.gymPreset.findUnique({
        where: { id: req.params.id },
        include: { targets: true },
    });
    if (!preset) return res.status(404).json({ message: "Not found" });
    res.json(preset);
});

/**
 * @swagger
 * /gym/presets/{id}:
 *   patch:
 *     tags: [Exercises]
 *     summary: Update preset meta (name, imageUrl, instructions)
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
 *               imageUrl: { type: string }
 *               instructions: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.patch("/presets/:id", async (req, res) => {
    const { name, imageUrl, instructions } = req.body as {
        name?: string;
        imageUrl?: string;
        instructions?: string;
    };
    try {
        const updated = await prisma.gymPreset.update({
            where: { id: req.params.id },
            data: { name, imageUrl, instructions },
        });
        res.json(updated);
    } catch (e) {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /gym/presets/{id}/targets:
 *   post:
 *     tags: [Exercises]
 *     summary: Add target muscles to a preset (upsert)
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
 *             required: [details]
 *             properties:
 *               details:
 *                 type: array
 *                 items: { type: string, example: "Quads" }
 *     responses:
 *       200: { description: OK }
 */
r.post("/presets/:id/targets", async (req, res) => {
    const { details } = req.body as { details: string[] };
    if (!Array.isArray(details) || details.length === 0) {
        return res.status(400).json({ message: "details[] required" });
    }
    if (details.some((d) => !isMuscleDetailed(d))) {
        return res.status(400).json({ message: "invalid details[]" });
    }
    const presetId = req.params.id;

    try {
        await prisma.gymPreset.findUniqueOrThrow({ where: { id: presetId }, select: { id: true } });
    } catch {
        return res.status(404).json({ message: "Preset not found" });
    }

    const created = await prisma.$transaction(
        details.map((detail) =>
            prisma.gymPresetTarget.upsert({
                where: { presetId_detail: { presetId, detail: detail as MuscleDetailed } },
                update: {},
                create: { presetId, detail: detail as MuscleDetailed },
            })
        )
    );
    res.json(created);
});

/**
 * @swagger
 * /gym/presets/{id}/targets/{detail}:
 *   delete:
 *     tags: [Exercises]
 *     summary: Remove a target muscle from a preset
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: detail
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/presets/:id/targets/:detail", async (req, res) => {
    const { id, detail } = req.params as { id: string; detail: string };
    if (!isMuscleDetailed(detail)) return res.status(400).json({ message: "invalid detail" });
    try {
        await prisma.gymPresetTarget.delete({
            where: { presetId_detail: { presetId: id, detail: detail as MuscleDetailed } },
        });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});
