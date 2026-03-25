import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Optional auth: if Authorization Bearer token is present and valid, set req.user.
 * MVP: routes may still accept authorId/raterId in body; production should derive identity from req.user only.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      username: string;
      email?: string | null;
    };
    req.user = {
      id: decoded.id,
      username: decoded.username,
      ...(decoded.email !== undefined ? { email: decoded.email } : {}),
    };
  } catch {
    // Invalid token: leave req.user unset
  }
  next();
}
