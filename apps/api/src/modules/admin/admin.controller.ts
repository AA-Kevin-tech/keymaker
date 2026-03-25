import type { Request, Response } from "express";

/**
 * Phase 1 placeholders — real handlers land in later phases (dashboard, reports, appeals, etc.).
 */
export function notImplemented(_req: Request, res: Response): void {
  res.status(501).json({
    error: "Not implemented yet",
    phase: "See roadmap: admin dashboard & moderation modules",
  });
}

export async function dashboard(_req: Request, res: Response): Promise<void> {
  res.status(501).json({
    error: "Admin dashboard not implemented (Phase 5)",
  });
}
