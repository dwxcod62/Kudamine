// routes/navbar.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const navbar = Router();

/** --------------------------
 *  Sidebar (merged by current user)
 *  -------------------------- */

/**
 * @openapi
 * /navbar/sidebar:
 *   get:
 *     summary: Get merged sidebar items for current user
 *     tags: [Navbar]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Dùng tạm khi chưa có auth; production lấy từ req.user.id
 *     responses:
 *       200:
 *         description: OK
 */
navbar.get("/sidebar", async (req, res) => {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const [catalog, prefs] = await Promise.all([
        prisma.navItem.findMany({
            where: { isActive: true },
            orderBy: [{ group: "asc" }, { position: "asc" }],
        }),
        prisma.userNavItem.findMany({ where: { userId } }),
    ]);

    const prefMap = new Map(prefs.map((p) => [p.navKey, p]));

    const visible = catalog.filter((item) => {
        const p = prefMap.get(item.key);
        return p ? p.enabled : true;
    });

    visible.sort((a, b) => {
        const pa = prefMap.get(a.key)?.position ?? a.position ?? 0;
        const pb = prefMap.get(b.key)?.position ?? b.position ?? 0;
        return pa - pb;
    });

    res.json(
        visible.map((it) => ({
            key: it.key,
            label: it.label,
            path: it.path,
            iconKey: it.iconKey,
            group: it.group,
            position: prefMap.get(it.key)?.position ?? it.position ?? 0,
            pinned: prefMap.get(it.key)?.pinned ?? false,
        }))
    );
});

/**
 * @openapi
 * /navbar/sidebar:
 *   put:
 *     summary: Update sidebar prefs for current user (bulk)
 *     tags: [Navbar]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Dùng tạm khi chưa có auth; production lấy từ req.user.id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePrefsBody'
 *     responses:
 *       200: { description: OK }
 */
navbar.put("/sidebar", async (req, res) => {
    const userId = (req as any).user?.id || (req.query.userId as string);
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const {
        enabledKeys = [],
        orderedKeys = [],
        pinnedKeys = [],
    } = (req.body ?? {}) as {
        enabledKeys?: string[];
        orderedKeys?: string[];
        pinnedKeys?: string[];
    };

    const enabledSet = new Set(enabledKeys);
    const pinnedSet = new Set(pinnedKeys);
    const orderIndex = new Map(orderedKeys.map((k, i) => [k, i]));

    const activeItems = await prisma.navItem.findMany({
        where: { isActive: true },
        select: { key: true },
    });

    await prisma.$transaction(
        activeItems.map(({ key }) =>
            prisma.userNavItem.upsert({
                where: { userId_navKey: { userId, navKey: key } },
                create: {
                    userId,
                    navKey: key,
                    enabled: enabledSet.has(key),
                    position: orderIndex.get(key) ?? null,
                    pinned: pinnedSet.has(key),
                },
                update: {
                    enabled: enabledSet.has(key),
                    position: orderIndex.get(key) ?? null,
                    pinned: pinnedSet.has(key),
                },
            })
        )
    );

    res.json({ ok: true });
});

/** --------------------------
 *  NavItem catalog (admin)
 *  -------------------------- */

/**
 * @swagger
 * /navbar/items:
 *   get:
 *     tags: [Navbar]
 *     summary: List NavItem catalog
 *     parameters:
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: OK }
 */
navbar.get("/items", async (req, res) => {
    const active = req.query.active;
    const where = active === undefined ? {} : { isActive: String(active).toLowerCase() === "true" };
    const items = await prisma.navItem.findMany({
        where,
        orderBy: [{ group: "asc" }, { position: "asc" }],
    });
    res.json(items);
});

/**
 * @swagger
 * /navbar/items/{key}:
 *   get:
 *     tags: [Navbar]
 *     summary: Get NavItem by key
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not Found }
 */
navbar.get("/items/:key", async (req, res) => {
    const item = await prisma.navItem.findUnique({ where: { key: req.params.key } });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
});

/**
 * @swagger
 * /navbar/items:
 *   post:
 *     tags: [Navbar]
 *     summary: Create NavItem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NavItemCreate'
 *     responses:
 *       201: { description: Created }
 */
navbar.post("/items", async (req, res) => {
    const { key, label, path, iconKey, group, position, isActive } = req.body;
    const created = await prisma.navItem.create({
        data: {
            key,
            label,
            path,
            iconKey: iconKey ?? null,
            group: group ?? null,
            position: position ?? 0,
            isActive: isActive ?? true,
        },
    });
    res.status(201).json(created);
});

/**
 * @swagger
 * /navbar/items/{key}:
 *   patch:
 *     tags: [Navbar]
 *     summary: Update NavItem (partial)
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NavItemUpdate'
 *     responses:
 *       200: { description: OK }
 */
navbar.patch("/items/:key", async (req, res) => {
    const { label, path, iconKey, group, position, isActive } = req.body;
    try {
        const updated = await prisma.navItem.update({
            where: { key: req.params.key },
            data: {
                ...(label !== undefined && { label }),
                ...(path !== undefined && { path }),
                ...(iconKey !== undefined && { iconKey }),
                ...(group !== undefined && { group }),
                ...(position !== undefined && { position }),
                ...(isActive !== undefined && { isActive }),
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ error: "Not found" });
    }
});

/**
 * @swagger
 * /navbar/items/{key}:
 *   delete:
 *     tags: [Navbar]
 *     summary: Delete NavItem
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: No Content }
 */
navbar.delete("/items/:key", async (req, res) => {
    try {
        await prisma.navItem.delete({ where: { key: req.params.key } });
        res.status(204).send();
    } catch {
        res.status(404).json({ error: "Not found" });
    }
});

/** --------------------------
 *  User prefs (specific user)
 *  -------------------------- */

/**
 * @swagger
 * /navbar/users/{userId}/prefs:
 *   get:
 *     tags: [Navbar]
 *     summary: Get UserNavItem list for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
navbar.get("/users/:userId/prefs", async (req, res) => {
    const { userId } = req.params;
    const prefs = await prisma.userNavItem.findMany({
        where: { userId },
        orderBy: [{ position: "asc" }],
    });
    res.json(prefs);
});

/**
 * @swagger
 * /navbar/users/{userId}/prefs:
 *   put:
 *     tags: [Navbar]
 *     summary: Upsert preferences (bulk) for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePrefsBody'
 *     responses:
 *       200: { description: OK }
 */
navbar.put("/users/:userId/prefs", async (req, res) => {
    const { userId } = req.params;
    const {
        enabledKeys = [],
        orderedKeys = [],
        pinnedKeys = [],
    } = (req.body ?? {}) as {
        enabledKeys?: string[];
        orderedKeys?: string[];
        pinnedKeys?: string[];
    };

    const enabledSet = new Set(enabledKeys);
    const pinnedSet = new Set(pinnedKeys);
    const orderIndex = new Map(orderedKeys.map((k, i) => [k, i]));

    const activeItems = await prisma.navItem.findMany({
        where: { isActive: true },
        select: { key: true },
    });

    await prisma.$transaction(
        activeItems.map(({ key }) =>
            prisma.userNavItem.upsert({
                where: { userId_navKey: { userId, navKey: key } },
                create: {
                    userId,
                    navKey: key,
                    enabled: enabledSet.has(key),
                    position: orderIndex.get(key) ?? null,
                    pinned: pinnedSet.has(key),
                },
                update: {
                    enabled: enabledSet.has(key),
                    position: orderIndex.get(key) ?? null,
                    pinned: pinnedSet.has(key),
                },
            })
        )
    );

    res.json({ ok: true });
});

/**
 * @openapi
 * /navbar/users/{userId}/sidebar:
 *   get:
 *     summary: Get sidebar items for a specific user (from UserNavItem)
 *     description: >
 *       Lấy danh sách NavItem của user dựa vào bảng **UserNavItem**.
 *       - Mặc định chỉ lấy item có `enabled=true` và `nav.isActive=true`.
 *       - Có thể dùng query `includeDisabled` hoặc `includeInactive` để nới lỏng.
 *     tags: [Navbar]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của user cần lấy sidebar
 *       - in: query
 *         name: includeDisabled
 *         schema:
 *           type: boolean
 *         description: Nếu true, trả cả item đang disabled (enabled=false)
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Nếu true, trả cả NavItem có isActive=false (bị admin ẩn)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key: { type: string }
 *                   label: { type: string }
 *                   path: { type: string }
 *                   iconKey: { type: string, nullable: true }
 *                   group: { type: string, nullable: true }
 *                   position: { type: integer }
 *                   pinned: { type: boolean }
 *                   enabled: { type: boolean }
 *                   isActive: { type: boolean }
 *       400:
 *         description: Missing userId
 */
navbar.get("/users/:userId/sidebar", async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const includeDisabled = String(req.query.includeDisabled ?? "false").toLowerCase() === "true";
    const includeInactive = String(req.query.includeInactive ?? "false").toLowerCase() === "true";

    const prefs = await prisma.userNavItem.findMany({
        where: {
            userId,
            ...(includeDisabled ? {} : { enabled: true }),
            ...(includeInactive ? {} : { nav: { isActive: true } }),
        },
        include: { nav: true },
        orderBy: [{ pinned: "desc" }, { position: "asc" }, { nav: { position: "asc" } }],
    });

    const items = prefs
        .filter((p) => !!p.nav)
        .map((p) => ({
            key: p.navKey,
            label: p.nav.label,
            path: p.nav.path,
            iconKey: p.nav.iconKey,
            group: p.nav.group,
            position: p.position ?? p.nav.position ?? 0,
            pinned: p.pinned ?? false,
            enabled: p.enabled,
            isActive: p.nav.isActive,
        }));

    res.json(items);
});

export default navbar;
