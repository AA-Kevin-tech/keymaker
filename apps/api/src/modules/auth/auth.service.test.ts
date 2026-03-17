import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../db/prisma.js";
import * as authService from "./auth.service.js";

describe("auth.service", () => {
  const unique = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: { startsWith: "user-" } } });
    await prisma.$disconnect();
  });

  it("register creates user and returns token", async () => {
    const result = await authService.register({
      username: unique,
      password: "password123",
    });
    expect(result.id).toBeDefined();
    expect(result.username).toBe(unique);
    expect(result.token).toBeDefined();
    expect(result.token.length).toBeGreaterThan(20);
  });

  it("register throws for duplicate username", async () => {
    await expect(
      authService.register({ username: unique, password: "other" })
    ).rejects.toThrow("Username already taken");
  });

  it("login returns token for valid credentials", async () => {
    const result = await authService.login({
      username: unique,
      password: "password123",
    });
    expect(result.id).toBeDefined();
    expect(result.username).toBe(unique);
    expect(result.token).toBeDefined();
  });

  it("login throws for wrong password", async () => {
    await expect(
      authService.login({ username: unique, password: "wrong" })
    ).rejects.toThrow("Invalid username or password");
  });

  it("login throws for unknown username", async () => {
    await expect(
      authService.login({ username: "nonexistent-user-xyz", password: "any" })
    ).rejects.toThrow("Invalid username or password");
  });
});
