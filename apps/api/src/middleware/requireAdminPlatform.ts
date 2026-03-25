import type { Request, Response, NextFunction } from "express";
import * as adminAuth from "../modules/admin/admin-authorization.service.js";

/**
 * Requires JWT auth and a platform moderator role (`super_admin` or `platform_moderator`).
 * Use after `authMiddleware` (global) and typically paired with `requireAuth` so missing tokens get 401 consistently.
 */
export function requireAdminPlatform(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  void (async () => {
    try {
      const allowed = await adminAuth.isPlatformStaff(req.user!.id);
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
