import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";

describe("API auth", () => {
  const username = `api-auth-${Date.now()}`;
  const password = "password123";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username } });
    await prisma.$disconnect();
  });

  it("POST /api/auth/register returns token and user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username, password })
      .expect(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toEqual({ id: expect.any(String), username });
  });

  it("POST /api/auth/login returns token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username, password })
      .expect(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(username);
  });

  it("GET /api/auth/me returns user when Bearer token sent", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ username, password });
    const token = loginRes.body.token;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(res.body.user).toEqual({ id: expect.any(String), username });
  });

  it("GET /api/auth/me returns 401 without token", async () => {
    await request(app).get("/api/auth/me").expect(401);
  });
});
