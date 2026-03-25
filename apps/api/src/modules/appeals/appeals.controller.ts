import type { NextFunction, Request, Response } from "express";
import * as appealsService from "./appeals.service.js";

export async function createAppeal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const row = await appealsService.createAppealFromUser(req.user.id, req.body);
    res.status(201).json({
      id: row.id,
      moderationActionId: row.moderationActionId,
      status: row.status,
      appealText: row.appealText,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
