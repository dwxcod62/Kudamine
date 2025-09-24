import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Playlists & tracks
 */

/**
 * @swagger
 * /playlists:
 *   get:
 *     tags: [Playlists]
 *     summary: List playlists by user
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/", async (req, res) => {
    const { userId } = req.query as any;
    if (!userId) return res.status(400).json({ message: "userId required" });
    const items = await prisma.playlist.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
    res.json(items);
});

/**
 * @swagger
 * /playlists:
 *   post:
 *     tags: [Playlists]
 *     summary: Create playlist
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
 *               coverUrl: { type: string }
 *     responses:
 *       201: { description: Created }
 */
router.post("/", async (req, res) => {
    const { userId, title, coverUrl } = req.body;
    if (!userId || !title) return res.status(400).json({ message: "userId & title required" });
    const pl = await prisma.playlist.create({
        data: { userId, title, coverUrl },
    });
    res.status(201).json(pl);
});

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     tags: [Playlists]
 *     summary: Get playlist with tracks (ordered by position)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get("/:id", async (req, res) => {
    const playlist = await prisma.playlist.findUnique({
        where: { id: req.params.id },
        include: { tracks: { orderBy: { position: "asc" } } },
    });
    if (!playlist) return res.status(404).json({ message: "Not found" });
    res.json(playlist);
});

/**
 * @swagger
 * /playlists/{id}:
 *   patch:
 *     tags: [Playlists]
 *     summary: Update playlist
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
 *               coverUrl: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.patch("/:id", async (req, res) => {
    const { title, coverUrl } = req.body;
    try {
        const updated = await prisma.playlist.update({
            where: { id: req.params.id },
            data: { title, coverUrl, updatedAt: new Date() },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     tags: [Playlists]
 *     summary: Delete playlist (and tracks by cascade)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.delete("/:id", async (req, res) => {
    try {
        await prisma.playlist.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /playlists/{id}/tracks:
 *   get:
 *     tags: [Playlists]
 *     summary: List tracks in playlist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id/tracks", async (req, res) => {
    const tracks = await prisma.track.findMany({
        where: { playlistId: req.params.id },
        orderBy: { position: "asc" },
    });
    res.json(tracks);
});

/**
 * @swagger
 * /playlists/{id}/tracks:
 *   post:
 *     tags: [Playlists]
 *     summary: Add tracks to playlist
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
 *                   required: [title, youtubeId]
 *                   properties:
 *                     title: { type: string }
 *                     artist: { type: string }
 *                     youtubeId: { type: string }
 *                     coverUrl: { type: string }
 *                     durationS: { type: integer }
 *                     position: { type: integer }
 *     responses:
 *       201: { description: Created }
 */
router.post("/:id/tracks", async (req, res) => {
    const playlistId = req.params.id;
    const { items } = req.body as {
        items: {
            title: string;
            artist?: string;
            youtubeId: string;
            coverUrl?: string;
            durationS?: number;
            position?: number;
        }[];
    };
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items[] required" });

    const created = await prisma.$transaction(
        items.map((t) =>
            prisma.track.create({
                data: {
                    playlistId,
                    title: t.title,
                    artist: t.artist,
                    youtubeId: t.youtubeId,
                    coverUrl: t.coverUrl,
                    durationS: t.durationS,
                    position: t.position ?? 0,
                },
            })
        )
    );
    res.status(201).json(created);
});

/**
 * @swagger
 * /tracks/{id}:
 *   patch:
 *     tags: [Playlists]
 *     summary: Update a track
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
 *               artist: { type: string }
 *               youtubeId: { type: string }
 *               coverUrl: { type: string }
 *               liked: { type: boolean }
 *               durationS: { type: integer }
 *               position: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.patch("/tracks/:id", async (req, res) => {
    const { title, artist, youtubeId, coverUrl, liked, durationS, position } = req.body;
    try {
        const updated = await prisma.track.update({
            where: { id: req.params.id },
            data: { title, artist, youtubeId, coverUrl, liked, durationS, position },
        });
        res.json(updated);
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /tracks/{id}:
 *   delete:
 *     tags: [Playlists]
 *     summary: Delete a track
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.delete("/tracks/:id", async (req, res) => {
    try {
        await prisma.track.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    } catch {
        res.status(404).json({ message: "Not found" });
    }
});

/**
 * @swagger
 * /playlists/{id}/tracks/reorder:
 *   post:
 *     tags: [Playlists]
 *     summary: Reorder tracks by positions
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
 *             required: [orders]
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id, position]
 *                   properties:
 *                     id: { type: string }
 *                     position: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.post("/:id/tracks/reorder", async (req, res) => {
    const { orders } = req.body as { orders: { id: string; position: number }[] };
    if (!Array.isArray(orders) || orders.length === 0) return res.status(400).json({ message: "orders[] required" });
    await prisma.$transaction(orders.map((o) => prisma.track.update({ where: { id: o.id }, data: { position: o.position } })));
    res.json({ ok: true });
});

export default router;
