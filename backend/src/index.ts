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

// ====== CORS (Express v5-safe) ======
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false, // set true only if using cookies/auth cross-origin
    })
);
// Handle preflight OPTIONS (regex instead of "*" for Express v5)
app.options(/.*/, cors());

// ====== Body parsers ======
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ====== Static ======
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ====== Swagger ======
setupSwagger(app);

// ====== Routes ======
app.use("/users", users);
app.use("/gym", gym);
app.use("/playlists", playlists);
app.use("/spending", spending);

// ====== Error handler ======
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || "Server error" });
});

// ====== Start server ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});
