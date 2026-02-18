// routes/navbar.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/lucky/redeem
 * body: { code: string, name?: string }
 */
router.post("/redeem", async (req, res) => {
    const { code, name } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Code is required" });
    }

    try {
        // Dùng transaction để tránh 2 tab redeem cùng lúc
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

router.get("/:code", async (req, res) => {
    const { code } = req.params;

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
});

export default router;
