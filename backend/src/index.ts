import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";

import { setupSwagger } from "./docs/swagger";
import gym from "./routes/gym";
import playlists from "./routes/playlists";
import spending from "./routes/spending";
import users from "./routes/users";

const app = express();
app.use(cors());
app.use(express.json());

setupSwagger(app);

app.use("/users", users);
app.use("/gym", gym);
app.use("/playlists", playlists);
app.use("/spending", spending);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(err?.status || 500).json({ error: err?.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/docs`);
});
