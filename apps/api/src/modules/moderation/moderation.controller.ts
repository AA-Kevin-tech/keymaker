import type { Request, Response } from "express";
import * as moderationService from "./moderation.service.js";

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const action = await moderationService.create({
      ...req.body,
      moderatorId: req.user.id,
    });
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
