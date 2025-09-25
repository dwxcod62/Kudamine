// src/routes/investments.ts
import { $Enums, PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const r = Router();

/** ===== Helpers ===== */
function toSym(symbol?: string) {
    return (symbol ?? "").trim().toUpperCase();
}

async function getOrCreateSecurityBySymbol(symbol: string, assetClass?: $Enums.AssetClass) {
    const sym = toSym(symbol);
    if (!sym) throw new Error("symbol is required");

    const ac = assetClass ?? "Equity";
    // Security có @@unique([symbol, assetClass])
    const found = await prisma.security.findFirst({
        where: { symbol: sym, assetClass: ac as $Enums.AssetClass },
    });
    if (found) return found;

    return prisma.security.create({
        data: {
            symbol: sym,
            assetClass: ac as $Enums.AssetClass,
            currency: "USD", // có thể đổi/nhận từ body nếu cần
        },
    });
}

/** =========================================================================
 *  Securities
 *  ========================================================================= */

/**
 * @openapi
 * /invest/securities:
 *   get:
 *     summary: List or search securities
 *     tags: [Investments - Securities]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by symbol (prefix) or exact
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: OK
 */
r.get("/securities", async (req, res) => {
    const q = String(req.query.q ?? "")
        .trim()
        .toUpperCase();
    const take = Number(req.query.take ?? 20);
    const skip = Number(req.query.skip ?? 0);

    const items = await prisma.security.findMany({
        where: q
            ? {
                  OR: [
                      { symbol: { startsWith: q } },
                      { symbol: q }, // đảm bảo match exact nếu cần
                  ],
              }
            : undefined,
        take,
        skip,
        orderBy: [{ symbol: "asc" }],
    });
    res.json(items);
});

/**
 * @openapi
 * /invest/securities/upsert:
 *   post:
 *     summary: Upsert security by symbol + assetClass
 *     tags: [Investments - Securities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol]
 *             properties:
 *               symbol: { type: string, example: "AAPL" }
 *               assetClass:
 *                 type: string
 *                 enum: [Equity, Crypto, ETF, Forex, Other]
 *               name: { type: string }
 *               currency:
 *                 type: string
 *                 enum: [USD, VND, EUR, JPY, GBP, Other]
 *               exchange: { type: string }
 *     responses:
 *       200: { description: OK }
 */
r.post("/securities/upsert", async (req, res) => {
    const { symbol, assetClass, name, currency, exchange } = (req.body ?? {}) as {
        symbol?: string;
        assetClass?: $Enums.AssetClass;
        name?: string;
        currency?: $Enums.Currency;
        exchange?: string;
    };

    const sym = toSym(symbol);
    if (!sym) return res.status(400).json({ message: "symbol is required" });

    const ac = (assetClass ?? "Equity") as $Enums.AssetClass;

    const existing = await prisma.security.findFirst({
        where: { symbol: sym, assetClass: ac },
    });

    if (existing) {
        const up = await prisma.security.update({
            where: { id: existing.id },
            data: { name, currency, exchange },
        });
        return res.json(up);
    }

    const created = await prisma.security.create({
        data: {
            symbol: sym,
            assetClass: ac,
            name,
            currency: currency ?? "USD",
            exchange,
        },
    });
    res.json(created);
});

/** =========================================================================
 *  Positions
 *  ========================================================================= */

/**
 * @openapi
 * /invest/positions:
 *   get:
 *     summary: List positions by user
 *     tags: [Investments - Positions]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: take
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200: { description: OK }
 */
r.get("/positions", async (req, res) => {
    const userId = String(req.query.userId ?? "");
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const take = Number(req.query.take ?? 50);
    const skip = Number(req.query.skip ?? 0);

    const items = await prisma.position.findMany({
        where: { userId },
        include: { security: true },
        orderBy: [{ createdAt: "desc" }],
        take,
        skip,
    });
    res.json(items);
});

/**
 * @openapi
 * /invest/positions:
 *   post:
 *     summary: Create/update a position for user + symbol (1 user - 1 security)
 *     tags: [Investments - Positions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, symbol, qty, avgBuyPrice]
 *             properties:
 *               userId: { type: string }
 *               symbol: { type: string, example: "AAPL" }
 *               assetClass:
 *                 type: string
 *                 enum: [Equity, Crypto, ETF, Forex, Other]
 *               qty: { type: string, example: "10.5" }
 *               avgBuyPrice: { type: string, example: "100.25" }
 *               targets:
 *                 type: object
 *                 properties:
 *                   targetUp: { type: string, example: "120" }
 *                   targetDown: { type: string, example: "90" }
 *                   bandPct: { type: string, example: "0.001" }
 *                   cooldownMs: { type: integer, example: 15000 }
 *                   notifyEnabled: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created / Updated }
 */
r.post("/positions", async (req, res) => {
    const { userId, symbol, assetClass, qty, avgBuyPrice, targets } = (req.body ?? {}) as {
        userId?: string;
        symbol?: string;
        assetClass?: $Enums.AssetClass;
        qty?: string | number;
        avgBuyPrice?: string | number;
        targets?: {
            targetUp?: string | number;
            targetDown?: string | number;
            bandPct?: string | number;
            cooldownMs?: number;
            notifyEnabled?: boolean;
        };
    };

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!symbol) return res.status(400).json({ message: "symbol is required" });

    const sec = await getOrCreateSecurityBySymbol(symbol, assetClass);

    // upsert Position (@@unique [userId, securityId])
    const pos = await prisma.position.upsert({
        where: { userId_securityId: { userId, securityId: sec.id } },
        create: {
            userId,
            securityId: sec.id,
            qty: qty as any, // Prisma Decimal nhận string/Decimal
            avgBuyPrice: avgBuyPrice as any,
        },
        update: {
            qty: qty as any,
            avgBuyPrice: avgBuyPrice as any,
            updatedAt: new Date(),
        },
    });

    // Nếu có targets => upsert PriceAlert
    if (targets) {
        const { targetUp, targetDown, bandPct, cooldownMs, notifyEnabled } = targets;
        await prisma.priceAlert
            .upsert({
                where: { userId_securityId: { userId, securityId: sec.id } },
                update: {
                    targetUp: targetUp != null ? (targetUp as any) : undefined,
                    targetDown: targetDown != null ? (targetDown as any) : undefined,
                    bandPct: bandPct != null ? (bandPct as any) : undefined,
                    cooldownMs: cooldownMs ?? undefined,
                    notifyEnabled: notifyEnabled ?? undefined,
                    updatedAt: new Date(),
                },
                create: {
                    userId,
                    securityId: sec.id,
                    targetUp: targetUp != null ? (targetUp as any) : undefined,
                    targetDown: targetDown != null ? (targetDown as any) : undefined,
                    bandPct: (bandPct as any) ?? ("0.001" as any),
                    cooldownMs: cooldownMs ?? 15000,
                    notifyEnabled: notifyEnabled ?? true,
                },
            })
            .catch(async () => {
                // Fallback nếu schema chưa có @@unique([userId, securityId]) cho PriceAlert
                const existing = await prisma.priceAlert.findFirst({ where: { userId, securityId: sec.id } });
                if (existing) {
                    await prisma.priceAlert.update({
                        where: { id: existing.id },
                        data: {
                            targetUp: targetUp != null ? (targetUp as any) : undefined,
                            targetDown: targetDown != null ? (targetDown as any) : undefined,
                            bandPct: bandPct != null ? (bandPct as any) : undefined,
                            cooldownMs: cooldownMs ?? undefined,
                            notifyEnabled: notifyEnabled ?? undefined,
                            updatedAt: new Date(),
                        },
                    });
                } else {
                    await prisma.priceAlert.create({
                        data: {
                            userId,
                            securityId: sec.id,
                            targetUp: targetUp != null ? (targetUp as any) : undefined,
                            targetDown: targetDown != null ? (targetDown as any) : undefined,
                            bandPct: (bandPct as any) ?? ("0.001" as any),
                            cooldownMs: cooldownMs ?? 15000,
                            notifyEnabled: notifyEnabled ?? true,
                        },
                    });
                }
            });
    }

    res.status(201).json(pos);
});

/**
 * @swagger
 * /invest/positions/{id}:
 *   patch:
 *     tags: [Investments - Positions]
 *     summary: Update position (qty/avgBuyPrice)
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
 *               qty: { type: string }
 *               avgBuyPrice: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.patch("/positions/:id", async (req, res) => {
    const { qty, avgBuyPrice } = req.body ?? {};
    try {
        const up = await prisma.position.update({
            where: { id: req.params.id },
            data: {
                qty: qty != null ? (qty as any) : undefined,
                avgBuyPrice: avgBuyPrice != null ? (avgBuyPrice as any) : undefined,
                updatedAt: new Date(),
            },
        });
        res.json(up);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /invest/positions/{id}:
 *   delete:
 *     tags: [Investments - Positions]
 *     summary: Delete position
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/positions/:id", async (req, res) => {
    try {
        await prisma.position.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/** =========================================================================
 *  Watchlist
 *  ========================================================================= */

/**
 * @openapi
 * /invest/watchlist:
 *   get:
 *     summary: List watchlist by user
 *     tags: [Investments - Watchlist]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
r.get("/watchlist", async (req, res) => {
    const userId = String(req.query.userId ?? "");
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const items = await prisma.watchItem.findMany({
        where: { userId },
        include: { security: true },
        orderBy: [{ createdAt: "desc" }],
    });
    res.json(items);
});

/**
 * @openapi
 * /invest/watchlist:
 *   post:
 *     summary: Add to watchlist (user + symbol)
 *     tags: [Investments - Watchlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, symbol]
 *             properties:
 *               userId: { type: string }
 *               symbol: { type: string }
 *               assetClass:
 *                 type: string
 *                 enum: [Equity, Crypto, ETF, Forex, Other]
 *               note: { type: string }
 *     responses:
 *       201: { description: Created / exists }
 */
r.post("/watchlist", async (req, res) => {
    const { userId, symbol, assetClass, note } = (req.body ?? {}) as {
        userId?: string;
        symbol?: string;
        assetClass?: $Enums.AssetClass;
        note?: string;
    };

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!symbol) return res.status(400).json({ message: "symbol is required" });

    const sec = await getOrCreateSecurityBySymbol(symbol, assetClass);

    // @@unique([userId, securityId])
    const item = await prisma.watchItem.upsert({
        where: { userId_securityId: { userId, securityId: sec.id } },
        update: { note: note ?? undefined },
        create: { userId, securityId: sec.id, note },
    });
    res.status(201).json(item);
});

/**
 * @swagger
 * /invest/watchlist/{id}:
 *   delete:
 *     tags: [Investments - Watchlist]
 *     summary: Remove from watchlist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/watchlist/:id", async (req, res) => {
    try {
        await prisma.watchItem.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/** =========================================================================
 *  Alerts
 *  ========================================================================= */

/**
 * @openapi
 * /invest/alerts:
 *   get:
 *     summary: List price alerts by user
 *     tags: [Investments - Alerts]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
r.get("/alerts", async (req, res) => {
    const userId = String(req.query.userId ?? "");
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const items = await prisma.priceAlert.findMany({
        where: { userId },
        include: { security: true },
        orderBy: [{ updatedAt: "desc" }],
    });
    res.json(items);
});

/**
 * @openapi
 * /invest/alerts:
 *   post:
 *     summary: Create/Update alert for user + symbol
 *     tags: [Investments - Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, symbol]
 *             properties:
 *               userId: { type: string }
 *               symbol: { type: string }
 *               assetClass:
 *                 type: string
 *                 enum: [Equity, Crypto, ETF, Forex, Other]
 *               targetUp: { type: string }
 *               targetDown: { type: string }
 *               bandPct: { type: string, example: "0.001" }
 *               cooldownMs: { type: integer, example: 15000 }
 *               notifyEnabled: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created/Updated }
 */
r.post("/alerts", async (req, res) => {
    const { userId, symbol, assetClass, targetUp, targetDown, bandPct, cooldownMs, notifyEnabled } = (req.body ?? {}) as {
        userId?: string;
        symbol?: string;
        assetClass?: $Enums.AssetClass;
        targetUp?: string | number;
        targetDown?: string | number;
        bandPct?: string | number;
        cooldownMs?: number;
        notifyEnabled?: boolean;
    };

    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (!symbol) return res.status(400).json({ message: "symbol is required" });

    const sec = await getOrCreateSecurityBySymbol(symbol, assetClass);

    // Nếu schema PriceAlert có @@unique([userId, securityId]) thì dùng upsert này
    const alert = await prisma.priceAlert
        .upsert({
            where: { userId_securityId: { userId, securityId: sec.id } },
            update: {
                targetUp: targetUp != null ? (targetUp as any) : undefined,
                targetDown: targetDown != null ? (targetDown as any) : undefined,
                bandPct: bandPct != null ? (bandPct as any) : undefined,
                cooldownMs: cooldownMs ?? undefined,
                notifyEnabled: notifyEnabled ?? undefined,
                updatedAt: new Date(),
            },
            create: {
                userId,
                securityId: sec.id,
                targetUp: targetUp != null ? (targetUp as any) : undefined,
                targetDown: targetDown != null ? (targetDown as any) : undefined,
                bandPct: (bandPct as any) ?? ("0.001" as any),
                cooldownMs: cooldownMs ?? 15000,
                notifyEnabled: notifyEnabled ?? true,
            },
        })
        .catch(async () => {
            // fallback nếu chưa có unique
            const ex = await prisma.priceAlert.findFirst({ where: { userId, securityId: sec.id } });
            if (ex) {
                return prisma.priceAlert.update({
                    where: { id: ex.id },
                    data: {
                        targetUp: targetUp != null ? (targetUp as any) : undefined,
                        targetDown: targetDown != null ? (targetDown as any) : undefined,
                        bandPct: bandPct != null ? (bandPct as any) : undefined,
                        cooldownMs: cooldownMs ?? undefined,
                        notifyEnabled: notifyEnabled ?? undefined,
                        updatedAt: new Date(),
                    },
                });
            }
            return prisma.priceAlert.create({
                data: {
                    userId,
                    securityId: sec.id,
                    targetUp: targetUp != null ? (targetUp as any) : undefined,
                    targetDown: targetDown != null ? (targetDown as any) : undefined,
                    bandPct: (bandPct as any) ?? ("0.001" as any),
                    cooldownMs: cooldownMs ?? 15000,
                    notifyEnabled: notifyEnabled ?? true,
                },
            });
        });

    res.status(201).json(alert);
});

/**
 * @swagger
 * /invest/alerts/{id}:
 *   patch:
 *     tags: [Investments - Alerts]
 *     summary: Update alert by id
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
 *               targetUp: { type: string }
 *               targetDown: { type: string }
 *               bandPct: { type: string }
 *               cooldownMs: { type: integer }
 *               notifyEnabled: { type: boolean }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.patch("/alerts/:id", async (req, res) => {
    const { targetUp, targetDown, bandPct, cooldownMs, notifyEnabled } = req.body ?? {};
    try {
        const up = await prisma.priceAlert.update({
            where: { id: req.params.id },
            data: {
                targetUp: targetUp != null ? (targetUp as any) : undefined,
                targetDown: targetDown != null ? (targetDown as any) : undefined,
                bandPct: bandPct != null ? (bandPct as any) : undefined,
                cooldownMs: cooldownMs ?? undefined,
                notifyEnabled: notifyEnabled ?? undefined,
                updatedAt: new Date(),
            },
        });
        res.json(up);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /invest/alerts/{id}:
 *   delete:
 *     tags: [Investments - Alerts]
 *     summary: Delete alert by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
r.delete("/alerts/:id", async (req, res) => {
    try {
        await prisma.priceAlert.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/** =========================================================================
 *  (Optional) Price snapshots: ghi lịch sử giá nếu bạn lưu từ cron/worker
 *  ========================================================================= */

/**
 * @openapi
 * /invest/snapshots:
 *   post:
 *     summary: Create price snapshot for a symbol
 *     tags: [Investments - Snapshots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symbol, price]
 *             properties:
 *               symbol: { type: string }
 *               assetClass:
 *                 type: string
 *                 enum: [Equity, Crypto, ETF, Forex, Other]
 *               ts:
 *                 type: string
 *                 format: date-time
 *               price: { type: string, example: "123.45" }
 *               source: { type: string, example: "Finnhub" }
 *     responses:
 *       201: { description: Created }
 */
r.post("/snapshots", async (req, res) => {
    const { symbol, assetClass, ts, price, source } = (req.body ?? {}) as {
        symbol?: string;
        assetClass?: $Enums.AssetClass;
        ts?: string;
        price?: string | number;
        source?: string;
    };

    if (!symbol) return res.status(400).json({ message: "symbol is required" });
    if (price == null) return res.status(400).json({ message: "price is required" });

    const sec = await getOrCreateSecurityBySymbol(symbol, assetClass);

    const snap = await prisma.priceSnapshot.create({
        data: {
            securityId: sec.id,
            ts: ts ? new Date(ts) : new Date(),
            price: price as any,
            source,
        },
    });
    res.status(201).json(snap);
});

export default r;
