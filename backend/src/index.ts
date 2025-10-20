// server.ts / index.ts
import cors, { CorsOptionsDelegate } from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { setupSwagger } from "./docs/swagger";
import gym from "./routes/gym";
import navbar from "./routes/navbar";
import playlists from "./routes/playlists";
import spending from "./routes/spending";
import timetable from "./routes/timetable";
import users from "./routes/users";

const app = express();

/**
 * =========================
 * CORS allow-list settings
 * =========================
 * - ENV CORS_ORIGINS="http://localhost:5173,https://kudamine.vercel.app"
 * - Tự động allow *.vercel.app (preview Vercel)
 */
const raw =
    process.env.CORS_ORIGINS ??
    "http://localhost:5173,https://kudamine.vercel.app,https://kudamii.info,https://www.kudamii.info,http://localhost:3000";
const allowedOrigins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const vercelPreviewRegex = /\.vercel\.app$/;

const corsOptionsDelegate: CorsOptionsDelegate = (req, cb) => {
    const origin = (req.headers.origin as string) || "";
    // Request không có Origin (curl/health) -> không set CORS
    if (!origin) return cb(null, { origin: false });

    let allow = false;
    try {
        const { hostname } = new URL(origin);
        allow = allowedOrigins.includes(origin) || vercelPreviewRegex.test(hostname);
    } catch {
        allow = false;
    }
    if (!allow) return cb(null, { origin: false });

    cb(null, {
        // Khi dùng credentials phía FE, luôn echo đúng origin
        origin,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-user-id"],
        exposedHeaders: ["Set-Cookie"],
        maxAge: 86400,
    });
};

// ===== Middleware CORS đứng trước mọi route =====
app.use(cors(corsOptionsDelegate));

// ===== Preflight: tránh path-to-regexp lỗi trên Express v5 =====
app.use((req, res, next) => {
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

// Body parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Swagger
setupSwagger(app);

// Routes
app.use("/users", users);
app.use("/gym", gym);
app.use("/playlists", playlists);
app.use("/spending", spending);
app.use("/tt", timetable);
app.use("/navbar", navbar);

// Error handler (cuối cùng)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const code = err?.status || 500;
    res.status(code).json({ error: err?.message || "Server error" });
});

// Start
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST ?? "0.0.0.0"; // để WSL/Docker truy cập được
app.listen(PORT, HOST, () => {
    console.log(`API running at http://${HOST}:${PORT}`);
    console.log(`Swagger docs at http://${HOST}:${PORT}/docs`);
});
