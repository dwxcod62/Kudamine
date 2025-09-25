// server.ts / index.ts
import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { setupSwagger } from "./docs/swagger";
import gym from "./routes/gym";
import playlists from "./routes/playlists";
import spending from "./routes/spending";
import users from "./routes/users";

const app = express();

/**
 * Allowed origins:
 * - đọc từ env CORS_ORIGINS="http://localhost:5173,https://kudamine.vercel.app"
 * - thêm rule cho tất cả preview Vercel: *.vercel.app
 */
const raw = process.env.CORS_ORIGINS ?? "http://localhost:5173,https://kudamine.vercel.app";
const allowedOrigins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const vercelPreviewRegex = /\.vercel\.app$/; // match mọi subdomain vercel

const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
        // Các request không có Origin (curl, healthchecks)
        if (!origin) return cb(null, true);

        if (allowedOrigins.includes(origin)) return cb(null, true);
        try {
            const { hostname } = new URL(origin);
            if (vercelPreviewRegex.test(hostname)) return cb(null, true);
        } catch {
            // bỏ qua nếu URL parse lỗi
        }
        return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // bật true nếu dùng cookie/session cross-site
};

app.use(cors(corsOptions));
// preflight (dùng cùng options để header khớp)
app.options(/.*/, cors(corsOptions));

// Body parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger
setupSwagger(app);

// Routes
app.use("/users", users);
app.use("/gym", gym);
app.use("/playlists", playlists);
app.use("/spending", spending);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || "Server error" });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});
