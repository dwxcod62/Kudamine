import express, { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/prisma";
import usersRouter from "./users";

let app: Express;

beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/users", usersRouter);
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe("Users API", () => {
    it("POST /users should create a new user", async () => {
        const res = await request(app).post("/users").send({ email: "test@example.com", name: "Test User" }).expect(201);

        expect(res.body).toHaveProperty("id");
        expect(res.body.email).toBe("test@example.com");
    });

    it("GET /users should return users array", async () => {
        const res = await request(app).get("/users").expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty("email");
    });
});
