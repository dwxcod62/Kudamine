import { $Enums, PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const r = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Get list of users
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: take
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
r.get("/", async (req, res) => {
    const take = Number(req.query.take ?? 20);
    const skip = Number(req.query.skip ?? 0);
    const users = await prisma.user.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
    });
    res.json(users);
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
r.post("/", async (req, res) => {
    const { email, name } = req.body ?? {};
    const user = await prisma.user.create({
        data: {
            email,
            name,
        },
    });
    res.status(201).json(user);
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.get("/:id", async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
    });
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
});

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user
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
 *               email: { type: string }
 *               name: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.patch("/:id", async (req, res) => {
    const { email, name } = req.body;
    try {
        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { email, name },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/:id", async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /users/{id}/settings:
 *   get:
 *     tags: [Users]
 *     summary: Get user settings
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.get("/:id/settings", async (req, res) => {
    const settings = await prisma.userSettings.findUnique({
        where: { userId: req.params.id },
    });
    if (!settings) return res.status(404).json({ message: "Not found" });
    res.json(settings);
});

/**
 * @swagger
 * /users/{id}/settings:
 *   put:
 *     tags: [Users]
 *     summary: Upsert user settings
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
 *               unit:
 *                 type: string
 *                 enum: [kg, lb]
 *     responses:
 *       200: { description: OK }
 */
r.put("/:id/settings", async (req, res) => {
    const { unit } = req.body as { unit?: $Enums.Unit };
    const up = await prisma.userSettings.upsert({
        where: { userId: req.params.id },
        update: { unit: unit ?? undefined, updatedAt: new Date() },
        create: { userId: req.params.id, unit: unit ?? "kg" },
    });
    res.json(up);
});

export default r;
