import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { validateRegisterBody, validateLoginBody } from "./auth.schema.js";

export async function register(req: Request, res: Response): Promise<void> {
  const result = validateRegisterBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  try {
    const { id, username, token } = await authService.register(req.body);
    res.status(201).json({ token, user: { id, username } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed";
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = validateLoginBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  try {
    const { id, username, token } = await authService.login(req.body);
    res.json({ token, user: { id, username } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    res.status(401).json({ error: message });
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
  res.json({ user: { id: req.user.id, username: req.user.username } });
}
