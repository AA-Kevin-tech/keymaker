import type { Request, Response } from "express";
import * as moderationService from "./moderation.service.js";

function validateCreateBody(body: unknown): { valid: true; data: Record<string, unknown> } | { valid: false; message: string } {
  if (!body || typeof body !== "object") return { valid: false, message: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.actionType !== "string" || !b.actionType.trim()) return { valid: false, message: "actionType is required" };
  if (typeof b.targetType !== "string" || !b.targetType.trim()) return { valid: false, message: "targetType is required" };
  if (typeof b.targetId !== "string" || !b.targetId.trim()) return { valid: false, message: "targetId is required" };
  if (typeof b.moderatorId !== "string" || !b.moderatorId.trim()) return { valid: false, message: "moderatorId is required" };
  return { valid: true, data: b };
}

export async function create(req: Request, res: Response): Promise<void> {
  const result = validateCreateBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  const body = req.body as {
    actionType: string;
    targetType: string;
    targetId: string;
    moderatorId: string;
    communityId?: string | null;
    reason?: string | null;
  };
  try {
    const action = await moderationService.create(body);
    res.status(201).json({
      id: action.id,
      actionType: action.actionType,
      targetType: action.targetType,
      targetId: action.targetId,
      moderatorId: action.moderatorId,
      communityId: action.communityId,
      reason: action.reason,
      createdAt: action.createdAt.toISOString(),
    });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
  }
}

export async function listByCommunity(req: Request, res: Response): Promise<void> {
  const { communityId } = req.params;
  const actions = await moderationService.listByCommunity(communityId);
  res.json({
    actions: actions.map((a) => ({
      id: a.id,
      actionType: a.actionType,
      targetType: a.targetType,
      targetId: a.targetId,
      moderatorId: a.moderatorId,
      moderator: a.moderator,
      communityId: a.communityId,
      reason: a.reason,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function listByTarget(req: Request, res: Response): Promise<void> {
  const { targetType, targetId } = req.params;
  const actions = await moderationService.listByTarget(targetType, targetId);
  res.json({
    actions: actions.map((a) => ({
      id: a.id,
      actionType: a.actionType,
      targetType: a.targetType,
      targetId: a.targetId,
      moderatorId: a.moderatorId,
      moderator: a.moderator,
      communityId: a.communityId,
      reason: a.reason,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
