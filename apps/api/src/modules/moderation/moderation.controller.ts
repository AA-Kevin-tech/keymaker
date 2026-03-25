import type { NextFunction, Request, Response } from "express";
import * as adminAuth from "../admin/admin-authorization.service.js";
import * as moderationService from "./moderation.service.js";

export async function listByCommunity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { communityId } = req.params;
    await adminAuth.assertCanReadModerationHistory(req.user.id, communityId);
    const actions = await moderationService.listByCommunity(communityId);
    type ActionItem = (typeof actions)[number];
    res.json({
      actions: actions.map((a: ActionItem) => ({
        id: a.id,
        actionType: a.actionType,
        targetType: a.targetType,
        targetId: a.targetId,
        moderatorId: a.moderatorId,
        moderator: a.moderator,
        communityId: a.communityId,
        reasonCode: a.reasonCode,
        reasonText: a.reason,
        metadata: a.metadata ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function listByTarget(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { targetType, targetId } = req.params;
    const scopeCommunityId = await moderationService.resolveCommunityScopeForModerationRead(
      targetType,
      targetId
    );
    await adminAuth.assertCanReadModerationHistory(req.user.id, scopeCommunityId);
    const actions = await moderationService.listByTarget(targetType, targetId);
    type ActionItem = (typeof actions)[number];
    res.json({
      actions: actions.map((a: ActionItem) => ({
        id: a.id,
        actionType: a.actionType,
        targetType: a.targetType,
        targetId: a.targetId,
        moderatorId: a.moderatorId,
        moderator: a.moderator,
        communityId: a.communityId,
        reasonCode: a.reasonCode,
        reasonText: a.reason,
        metadata: a.metadata ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
