import type { Prisma, UserRestriction } from "@prisma/client";
import { UserRestrictionType } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "../admin/admin-authorization.service.js";
import { logModerationAction } from "../moderation/moderation-audit.service.js";

/** Derived flags for enforcement / admin UI. MVP: `temp_suspend` and `permanent_ban` disable both posting and rating. */
export type EffectiveRestrictionFlags = {
  canPost: boolean;
  canRate: boolean;
  postingBlocked: boolean;
  ratingBlocked: boolean;
  activeRestrictionTypes: UserRestrictionType[];
};

export function computeEffectiveRestrictionFlags(
  restrictions: Array<{
    restrictionType: UserRestrictionType;
    communityId: string | null;
    isActive: boolean;
    endsAt: Date | null;
  }>,
  now: Date,
  /** When set, only restrictions that are platform-wide or match this community apply. */
  forCommunityId: string | null | undefined
): EffectiveRestrictionFlags {
  const active = restrictions.filter((r) => {
    if (!r.isActive) return false;
    if (r.endsAt !== null && r.endsAt.getTime() <= now.getTime()) return false;
    if (r.communityId === null) return true;
    if (forCommunityId === undefined) return true;
    return r.communityId === forCommunityId;
  });

  let postingBlocked = false;
  let ratingBlocked = false;
  const types: UserRestrictionType[] = [];

  for (const r of active) {
    types.push(r.restrictionType);
    switch (r.restrictionType) {
      case UserRestrictionType.posting_block:
        postingBlocked = true;
        break;
      case UserRestrictionType.rating_block:
        ratingBlocked = true;
        break;
      case UserRestrictionType.temp_suspend:
      case UserRestrictionType.permanent_ban:
        postingBlocked = true;
        ratingBlocked = true;
        break;
      default:
        break;
    }
  }

  return {
    canPost: !postingBlocked,
    canRate: !ratingBlocked,
    postingBlocked,
    ratingBlocked,
    activeRestrictionTypes: [...new Set(types)],
  };
}

export type EffectiveModerationState = {
  asOf: string;
  /** Only `user_restrictions` rows with `communityId` null. */
  platformWide: EffectiveRestrictionFlags;
  /** Any active scoped restriction in at least one community. */
  hasCommunityScopedActive: boolean;
};

export async function getEffectiveModerationState(subjectUserId: string): Promise<EffectiveModerationState> {
  const now = new Date();
  const rows = await prisma.userRestriction.findMany({
    where: { userId: subjectUserId },
    select: { restrictionType: true, communityId: true, isActive: true, endsAt: true },
  });
  const platformRows = rows.filter((r) => r.communityId === null);
  const platformWide = computeEffectiveRestrictionFlags(platformRows, now, null);
  const hasCommunityScopedActive = rows.some((r) => {
    if (r.communityId === null) return false;
    if (!r.isActive) return false;
    if (r.endsAt !== null && r.endsAt.getTime() <= now.getTime()) return false;
    return true;
  });
  return {
    asOf: now.toISOString(),
    platformWide,
    hasCommunityScopedActive,
  };
}

/** Platform-wide restriction (`communityId` null) vs community-scoped. */
export async function assertCanManageRestrictionScope(
  moderatorId: string,
  communityId: string | null
): Promise<void> {
  if (communityId === null) {
    if (!(await adminAuth.isPlatformStaff(moderatorId))) {
      throw new HttpError(403, "Only platform moderators can manage community-wide restrictions");
    }
    return;
  }
  await adminAuth.assertModeratorCommunityAccess(moderatorId, communityId);
}

export async function assertCanViewAdminUser(moderatorId: string, subjectUserId: string): Promise<void> {
  if (await adminAuth.isPlatformStaff(moderatorId)) return;
  const modCommunities = await adminAuth.listModeratableCommunityIds(moderatorId);
  if (modCommunities.length === 0) {
    throw new HttpError(403, "Admin access denied");
  }
  const [restrictionScoped, postScoped] = await Promise.all([
    prisma.userRestriction.count({
      where: { userId: subjectUserId, communityId: { in: modCommunities } },
    }),
    prisma.post.count({
      where: { authorId: subjectUserId, communityId: { in: modCommunities } },
    }),
  ]);
  if (restrictionScoped === 0 && postScoped === 0) {
    throw new HttpError(403, "You do not have access to this user in admin");
  }
}

export type CreateUserRestrictionWithAuditParams = {
  subjectUserId: string;
  moderatorId: string;
  restrictionType: UserRestrictionType;
  communityId: string | null;
  reasonCode: string;
  reasonText: string | null;
  endsAt: Date | null;
  relatedReportId?: string | null;
};

/** Single path for new restrictions + audit row (report flow and direct admin create). */
export async function createUserRestrictionWithAuditTx(
  tx: Prisma.TransactionClient,
  params: CreateUserRestrictionWithAuditParams
): Promise<UserRestriction> {
  const restriction = await tx.userRestriction.create({
    data: {
      userId: params.subjectUserId,
      restrictionType: params.restrictionType,
      communityId: params.communityId,
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      startsAt: new Date(),
      endsAt: params.endsAt,
      createdById: params.moderatorId,
      isActive: true,
    },
  });
  await logModerationAction(
    {
      moderatorId: params.moderatorId,
      communityId: params.communityId,
      actionType: "restrict_user",
      targetType: "user",
      targetId: params.subjectUserId,
      reasonCode: params.reasonCode,
      reasonText: params.reasonText,
      metadata: {
        restrictionId: restriction.id,
        targetUserId: params.subjectUserId,
        ...(params.relatedReportId ? { relatedReportId: params.relatedReportId } : {}),
      },
    },
    tx
  );
  return restriction;
}

export async function createRestrictionFromAdmin(
  moderatorId: string,
  subjectUserId: string,
  body: {
    restrictionType: UserRestrictionType;
    communityId?: string | null;
    reasonCode: string;
    reasonText?: string | null;
    endsAt?: string | null;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: subjectUserId }, select: { id: true } });
  if (!user) throw new HttpError(404, "User not found");

  await assertCanViewAdminUser(moderatorId, subjectUserId);

  const scopeCommunityId = body.communityId?.trim() || null;
  await assertCanManageRestrictionScope(moderatorId, scopeCommunityId);

  const endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (body.restrictionType === UserRestrictionType.temp_suspend && !endsAt) {
    throw new HttpError(400, "endsAt is required for temp_suspend");
  }

  const reasonText = body.reasonText?.trim() || null;

  return prisma.$transaction((tx) =>
    createUserRestrictionWithAuditTx(tx, {
      subjectUserId,
      moderatorId,
      restrictionType: body.restrictionType,
      communityId: scopeCommunityId,
      reasonCode: body.reasonCode,
      reasonText,
      endsAt,
      relatedReportId: null,
    })
  );
}

const restrictionInclude = {
  community: { select: { id: true, name: true, slug: true } },
  createdBy: { select: { id: true, username: true } },
  deactivatedBy: { select: { id: true, username: true } },
} as const;

function serializeRestriction(
  r: Prisma.UserRestrictionGetPayload<{ include: typeof restrictionInclude }>,
  now: Date
) {
  const expiredByTime =
    r.isActive && r.endsAt !== null && r.endsAt.getTime() <= now.getTime();
  let lifecycle: "active" | "expired" | "lifted";
  if (!r.isActive) {
    lifecycle = "lifted";
  } else if (expiredByTime) {
    lifecycle = "expired";
  } else {
    lifecycle = "active";
  }

  return {
    id: r.id,
    restrictionType: r.restrictionType,
    communityId: r.communityId,
    community: r.community,
    reasonCode: r.reasonCode,
    reasonText: r.reasonText,
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt?.toISOString() ?? null,
    isActive: r.isActive,
    deactivatedAt: r.deactivatedAt?.toISOString() ?? null,
    deactivatedBy: r.deactivatedBy,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
    lifecycle,
  };
}

/** Caller must enforce access (e.g. `assertCanViewAdminUser`). */
export async function listRestrictionsForAdminView(moderatorId: string, subjectUserId: string) {
  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const where: Prisma.UserRestrictionWhereInput = { userId: subjectUserId };
  if (!platform) {
    const ids = await adminAuth.listModeratableCommunityIds(moderatorId);
    where.communityId = { in: ids };
  }

  const rows = await prisma.userRestriction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: restrictionInclude,
  });

  const now = new Date();
  const serialized = rows.map((r) => serializeRestriction(r, now));
  return {
    active: serialized.filter((r) => r.lifecycle === "active"),
    expired: serialized.filter((r) => r.lifecycle === "expired"),
    lifted: serialized.filter((r) => r.lifecycle === "lifted"),
    all: serialized,
  };
}

export type DeactivateRestrictionTxOptions = {
  /** If the row is already inactive, return null instead of throwing (appeal idempotency). */
  idempotentIfInactive?: boolean;
  /** When set, rejects if the restriction applies to a different user. */
  expectedSubjectUserId?: string;
};

/**
 * Lift a restriction inside a parent transaction (e.g. appeal modify/reversal).
 */
export async function deactivateRestrictionTx(
  tx: Prisma.TransactionClient,
  moderatorId: string,
  restrictionId: string,
  body: { reasonCode?: string; reasonText?: string | null },
  options: DeactivateRestrictionTxOptions = {}
) {
  const reasonCode = body.reasonCode ?? "other";
  const reasonText = body.reasonText?.trim() || null;

  const r = await tx.userRestriction.findUnique({
    where: { id: restrictionId },
  });
  if (!r) {
    throw new HttpError(404, "Restriction not found");
  }
  if (options.expectedSubjectUserId && r.userId !== options.expectedSubjectUserId) {
    throw new HttpError(400, "Restriction does not belong to this subject");
  }
  if (!r.isActive) {
    if (options.idempotentIfInactive) {
      return null;
    }
    throw new HttpError(400, "Restriction is already inactive");
  }

  await assertCanManageRestrictionScope(moderatorId, r.communityId);

  const now = new Date();
  await tx.userRestriction.update({
    where: { id: restrictionId },
    data: {
      isActive: false,
      deactivatedAt: now,
      deactivatedById: moderatorId,
    },
  });

  await logModerationAction(
    {
      moderatorId,
      communityId: r.communityId,
      actionType: "lift_restriction",
      targetType: "user",
      targetId: r.userId,
      reasonCode,
      reasonText,
      metadata: {
        restrictionId: r.id,
        targetUserId: r.userId,
      },
    },
    tx
  );

  return tx.userRestriction.findUnique({
    where: { id: restrictionId },
    include: restrictionInclude,
  });
}

export async function deactivateRestriction(
  moderatorId: string,
  restrictionId: string,
  body: { reasonCode?: string; reasonText?: string | null }
) {
  return prisma.$transaction((tx) =>
    deactivateRestrictionTx(tx, moderatorId, restrictionId, body, { idempotentIfInactive: false })
  );
}

/**
 * POST /api/admin/users/:id/unrestrict — resolve restriction then soft-deactivate (audit via `deactivateRestriction`).
 */
export async function unrestrictUserFromAdmin(
  moderatorId: string,
  subjectUserId: string,
  body: {
    restrictionId?: string;
    restrictionType?: UserRestrictionType;
    communityId?: string | null;
    reasonCode?: string;
    reasonText?: string | null;
  }
) {
  await assertCanViewAdminUser(moderatorId, subjectUserId);
  let restrictionId = body.restrictionId;

  if (restrictionId) {
    const existing = await prisma.userRestriction.findUnique({ where: { id: restrictionId } });
    if (!existing) {
      throw new HttpError(404, "Restriction not found");
    }
    if (existing.userId !== subjectUserId) {
      throw new HttpError(400, "Restriction does not belong to this user");
    }
  }

  if (!restrictionId && body.restrictionType) {
    const scopeUndefined = body.communityId === undefined;
    const scope =
      body.communityId === undefined ? undefined : body.communityId === null ? null : body.communityId.trim() || null;

    const found = await prisma.userRestriction.findFirst({
      where: {
        userId: subjectUserId,
        restrictionType: body.restrictionType,
        isActive: true,
        ...(scopeUndefined ? {} : { communityId: scope }),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!found) {
      throw new HttpError(404, "No matching active restriction found");
    }
    restrictionId = found.id;
  }

  if (!restrictionId) {
    throw new HttpError(400, "restrictionId could not be resolved");
  }

  return deactivateRestriction(moderatorId, restrictionId, {
    reasonCode: body.reasonCode,
    reasonText: body.reasonText,
  });
}
