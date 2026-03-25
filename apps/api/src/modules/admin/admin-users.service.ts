import type { Prisma } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "./admin-authorization.service.js";
import {
  assertCanViewAdminUser,
  listRestrictionsForAdminView,
} from "../user-restrictions/user-restrictions.service.js";

export async function getAdminUserDetail(moderatorId: string, userId: string) {
  await assertCanViewAdminUser(moderatorId, userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      createdAt: true,
      reputationClarity: true,
      reputationEvidence: true,
      reputationKindness: true,
      reputationNovelty: true,
    },
  });
  if (!user) throw new HttpError(404, "User not found");

  const restrictions = await listRestrictionsForAdminView(moderatorId, userId);

  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const modWhere: Prisma.ModerationActionWhereInput = {
    targetType: "user",
    targetId: userId,
  };
  if (!platform) {
    const ids = await adminAuth.listModeratableCommunityIds(moderatorId);
    modWhere.communityId = { in: ids };
  }

  const moderationHistory = await prisma.moderationAction.findMany({
    where: modWhere,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { moderator: { select: { id: true, username: true } } },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      reputationClarity: user.reputationClarity,
      reputationEvidence: user.reputationEvidence,
      reputationKindness: user.reputationKindness,
      reputationNovelty: user.reputationNovelty,
    },
    restrictions,
    moderationHistory: moderationHistory.map((m) => ({
      id: m.id,
      actionType: m.actionType,
      targetType: m.targetType,
      targetId: m.targetId,
      moderator: m.moderator,
      reasonCode: m.reasonCode,
      reasonText: m.reason,
      metadata: m.metadata ?? null,
      communityId: m.communityId,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
