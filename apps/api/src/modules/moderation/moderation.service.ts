import { prisma } from "../../db/prisma.js";
import type { CreateModerationActionBody } from "./moderation.types.js";

export async function create(body: CreateModerationActionBody) {
  return prisma.moderationAction.create({
    data: {
      actionType: body.actionType,
      targetType: body.targetType,
      targetId: body.targetId,
      moderatorId: body.moderatorId,
      communityId: body.communityId ?? null,
      reasonCode: body.reasonCode ?? null,
      reason: body.reason ?? null,
    },
  });
}

export async function listByCommunity(communityId: string) {
  return prisma.moderationAction.findMany({
    where: { communityId },
    orderBy: { createdAt: "desc" },
    include: { moderator: { select: { id: true, username: true } } },
  });
}

export async function listByTarget(targetType: string, targetId: string) {
  return prisma.moderationAction.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: "desc" },
    include: { moderator: { select: { id: true, username: true } } },
  });
}
