import type { NextFunction, Request, Response } from "express";
import * as appealsService from "../appeals/appeals.service.js";
import type { AdminAppealListQueryInput } from "./admin-appeals.types.js";

export async function listAppeals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const result = await appealsService.listAppealsForAdmin(
      req.user.id,
      req.query as unknown as AdminAppealListQueryInput
    );
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const detail = await appealsService.getAppealDetailForAdmin(req.user.id, req.params.id);
    res.json(detail);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function uphold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const row = await appealsService.upholdAppeal(req.user.id, req.params.id, req.body);
    res.json({
      id: row.id,
      status: row.status,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      decisionNote: row.decisionNote,
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function reverse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const row = await appealsService.reverseAppeal(req.user.id, req.params.id, req.body);
    res.json({
      id: row.id,
      status: row.status,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      decisionNote: row.decisionNote,
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function modify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const row = await appealsService.modifyAppeal(req.user.id, req.params.id, req.body);
    res.json({
      id: row?.id,
      status: row?.status,
      reviewedAt: row?.reviewedAt?.toISOString() ?? null,
      decisionNote: row?.decisionNote,
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
