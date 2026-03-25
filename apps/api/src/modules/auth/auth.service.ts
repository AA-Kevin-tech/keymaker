import { createHash, randomBytes } from "node:crypto";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";
import { sendVerificationEmail } from "../../email/verification-email.js";
import type { RegisterBody, LoginBody } from "./auth.types.js";
import type { RegisterResult } from "./auth.types.js";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function isVerificationSkipped(): boolean {
  return process.env.NODE_ENV === "test";
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function signJwt(user: { id: string; username: string; email: string | null }): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function issueVerificationToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await prisma.emailVerificationToken.upsert({
    where: { userId },
    create: { userId, tokenHash, expiresAt },
    update: { tokenHash, expiresAt },
  });
  return raw;
}

export async function register(body: RegisterBody): Promise<RegisterResult> {
  const existingUsername = await prisma.user.findUnique({ where: { username: body.username } });
  if (existingUsername) {
    throw new Error("Username already taken");
  }
  const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
  if (existingEmail) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const skipVerify = isVerificationSkipped();
  const emailVerifiedAt = skipVerify ? new Date() : null;

  const user = await prisma.user.create({
    data: {
      username: body.username,
      email: body.email,
      passwordHash,
      emailVerifiedAt,
    },
  });

  if (!skipVerify && !user.emailVerifiedAt && user.email) {
    const raw = await issueVerificationToken(user.id);
    await sendVerificationEmail(user.email, raw);
    return {
      kind: "pending",
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  const token = signJwt(user);
  return {
    kind: "session",
    id: user.id,
    username: user.username,
    email: user.email!,
    token,
  };
}

export async function login(body: LoginBody): Promise<{ id: string; username: string; email: string | null; token: string }> {
  const user = await prisma.user.findUnique({ where: { username: body.username } });
  if (!user) {
    throw new Error("Invalid username or password");
  }
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    throw new Error("Invalid username or password");
  }
  if (user.email && !user.emailVerifiedAt) {
    throw new Error("Please verify your email before logging in");
  }
  const token = signJwt(user);
  return { id: user.id, username: user.username, email: user.email, token };
}

export async function verifyEmailWithToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken.trim());
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
  });
  if (!record) {
    throw new Error("Invalid or expired verification link");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);
}

/**
 * Resend verification email. No-ops if email is unknown or already verified (anti-enumeration).
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.email || user.emailVerifiedAt) {
    return;
  }
  const raw = await issueVerificationToken(user.id);
  await sendVerificationEmail(user.email, raw);
}
