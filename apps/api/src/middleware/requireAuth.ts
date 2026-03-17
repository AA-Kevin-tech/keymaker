import type { Request, Response, NextFunction } from "express";

/**
 * Require authenticated user. Returns 401 if req.user is not set (no or invalid token).
 * Use after authMiddleware on routes that must be authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
