import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import type { RegisterBody, LoginBody } from "./auth.types.js";

export async function register(body: RegisterBody): Promise<{ id: string; username: string; token: string }> {
  const existing = await prisma.user.findUnique({ where: { username: body.username } });
  if (existing) {
    throw new Error("Username already taken");
  }
  const passwordHash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { username: body.username, passwordHash },
  });
  const token = jwt.sign(
    { id: user.id, username: user.username },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { id: user.id, username: user.username, token };
}

export async function login(body: LoginBody): Promise<{ id: string; username: string; token: string }> {
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user) {
    throw new Error("Invalid username or password");
  }
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid username or password");
  }
  const token = jwt.sign(
    { id: user.id, username: user.username },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { id: user.id, username: user.username, token };
}
