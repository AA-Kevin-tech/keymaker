import type { Request, Response } from "express";
import * as ratingsService from "./ratings.service.js";

export async function upsert(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const rating = await ratingsService.upsertRating({
      ...req.body,
      raterId: req.user.id,
    });
    res.json({
      id: rating.id,
      targetType: rating.targetType,
      targetId: rating.targetId,
      raterId: rating.raterId,
      clarity: rating.clarity,
      evidence: rating.evidence,
      kindness: rating.kindness,
      novelty: rating.novelty,
      createdAt: rating.createdAt.toISOString(),
      updatedAt: rating.updatedAt.toISOString(),
    });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Upsert failed" });
  }
}
