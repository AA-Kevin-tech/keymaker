import type { Request, Response } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await authService.register(req.body);
    if (result.kind === "session") {
      res.status(201).json({
        token: result.token,
        user: { id: result.id, username: result.username, email: result.email },
      });
      return;
    }
    res.status(201).json({
      pendingVerification: true,
      message: "Check your email to verify your account.",
      user: { id: result.id, username: result.username, email: result.email },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { id, username, email, token } = await authService.login(req.body);
    res.json({ token, user: { id, username, email } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    if (message === "Please verify your email before logging in") {
      res.status(403).json({ error: message });
      return;
    }
    res.status(401).json({ error: message });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    await authService.verifyEmailWithToken(req.body.token);
    res.json({ message: "Email verified. You can log in now." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification failed";
    res.status(400).json({ error: message });
  }
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    await authService.resendVerificationEmail(req.body.email);
    res.json({
      message: "If an account exists for that email and is not verified, we sent a new link.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    res.status(400).json({ error: message });
  }
}

/**
 * GET /auth/me - return current user from JWT. Requires valid Bearer token.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      ...(req.user.email !== undefined ? { email: req.user.email } : {}),
    },
  });
}
