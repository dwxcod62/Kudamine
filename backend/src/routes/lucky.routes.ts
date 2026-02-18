// routes/navbar.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Lucky
 *   description: Lucky Code API
 */

/**
 * @swagger
 * /api/lucky/redeem:
 *   post:
 *     summary: Redeem lucky code
 *     tags: [Lucky]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: TET2026ABC
 *               name:
 *                 type: string
 *                 example: Duc
 *     responses:
 *       200:
 *         description: Redeem success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: TET2026ABC
 *                 usedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Missing code
 *       404:
 *         description: Code not found
 *       409:
 *         description: Code already used
 */
router.post("/redeem", async (req, res) => {
    const { code, name } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Code is required" });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const lucky = await tx.luckyCode.findUnique({
                where: { code },
            });

            if (!lucky) {
                throw new Error("INVALID_CODE");
            }

            if (lucky.used) {
                throw new Error("ALREADY_USED");
            }

            const updated = await tx.luckyCode.update({
                where: { code },
                data: {
                    used: true,
                    usedAt: new Date(),
                    name: name || null,
                },
            });

            return updated;
        });

        return res.json({
            success: true,
            code: result.code,
            usedAt: result.usedAt,
        });
    } catch (err: any) {
        if (err.message === "INVALID_CODE") {
            return res.status(404).json({ message: "Code not found" });
        }

        if (err.message === "ALREADY_USED") {
            return res.status(409).json({ message: "Code already used" });
        }

        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/lucky/{code}:
 *   get:
 *     summary: Get lucky code status
 *     tags: [Lucky]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: TET2026ABC
 *     responses:
 *       200:
 *         description: Code status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 used:
 *                   type: boolean
 *                 name:
 *                   type: string
 *                 usedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Code not found
 */
router.get("/:code", async (req, res) => {
    const { code } = req.params;

    try {
        const lucky = await prisma.luckyCode.findUnique({
            where: { code },
        });

        if (!lucky) {
            return res.status(404).json({ message: "Code not found" });
        }

        return res.json({
            code: lucky.code,
            used: lucky.used,
            name: lucky.name,
            usedAt: lucky.usedAt,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /api/lucky/create:
 *   post:
 *     summary: Create a new lucky code
 *     tags: [Lucky]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: TET2026VIP
 *     responses:
 *       200:
 *         description: Code created successfully
 *       409:
 *         description: Code already exists
 */
router.post("/create", async (req, res) => {
    let { code } = req.body;

    try {
        // Nếu không truyền code → tự generate
        if (!code) {
            code = "LC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        const existing = await prisma.luckyCode.findUnique({
            where: { code },
        });

        if (existing) {
            return res.status(409).json({ message: "Code already exists" });
        }

        const created = await prisma.luckyCode.create({
            data: {
                code,
            },
        });

        return res.json({
            success: true,
            code: created.code,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
