import type { Request, Response, NextFunction } from "express";
import * as adminAuth from "../modules/admin/admin-authorization.service.js";

/**
 * JWT required; user must be platform staff (`super_admin` / `platform_moderator`) or hold any
 * community-scoped `ModeratorRole` (`community_admin` / `community_moderator`).
 * Fine-grained object access is enforced in services (community mods only see in-scope items).
 */
export function requireAdminAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  void (async () => {
    try {
      const allowed = await adminAuth.canAccessAdminArea(req.user!.id);
      if (!allowed) {
        res.status(403).json({ error: "Admin access denied" });
        return;
      }
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("Authorization failed"));
    }
  })();
}
