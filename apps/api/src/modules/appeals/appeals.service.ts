import type { AppealStatus, ModerationAction } from "@prisma/client";
import { AppealStatus as AppealStatusEnum, Prisma, UserRestrictionType } from "@prisma/client";
import type { z } from "zod";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "../admin/admin-authorization.service.js";
import * as moderationAudit from "../moderation/moderation-audit.service.js";
import {
  applyReversalForModerationActionInTx,
  assertModerationActionReversibleForAppeal,
} from "../moderation/moderation-reversal.service.js";
import {
  assertCanManageRestrictionScope,
  assertCanViewAdminUser,
  createUserRestrictionWithAuditTx,
  deactivateRestrictionTx,
} from "../user-restrictions/user-restrictions.service.js";
import type { AdminAppealListQuery } from "./appeals.types.js";
import type { CreateAppealBody } from "./appeals.types.js";
import { appealModifyBodySchema } from "./appeals.schema.js";

export type AppealModifyBody = z.infer<typeof appealModifyBodySchema>;

const appealInclude = {
  appellant: { select: { id: true, username: true } },
  reviewedBy: { select: { id: true, username: true } },
  moderationAction: {
    include: {
      moderator: { select: { id: true, username: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

type AppealRow = Prisma.AppealGetPayload<{ include: typeof appealInclude }>;

const APPEAL_ALREADY_DECIDED = "APPEAL_ALREADY_DECIDED";

function throwUnlessAppealClaimed(updateCount: number) {
  if (updateCount !== 1) {
    throw new HttpError(
      409,
      "Appeal already decided or no longer open",
      APPEAL_ALREADY_DECIDED
    );
  }
}

async function loadAppealForDecision(appealId: string): Promise<AppealRow> {
  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId },
    include: appealInclude,
  });
  if (!appeal) {
    throw new HttpError(404, "Appeal not found");
  }
  return appeal;
}

async function resolveCommunityIdForAction(action: ModerationAction): Promise<string | null> {
  if (action.communityId) {
    return action.communityId;
  }
  if (action.targetType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: action.targetId },
      select: { communityId: true },
    });
    return post?.communityId ?? null;
  }
  if (action.targetType === "comment") {
    const comment = await prisma.comment.findUnique({
      where: { id: action.targetId },
      select: { postId: true },
    });
    if (!comment) return null;
    const post = await prisma.post.findUnique({
      where: { id: comment.postId },
      select: { communityId: true },
    });
    return post?.communityId ?? null;
  }
  return null;
}

export async function assertCanReviewAppeal(moderatorId: string, action: ModerationAction): Promise<void> {
  if (await adminAuth.isPlatformStaff(moderatorId)) {
    return;
  }
  const comm = await resolveCommunityIdForAction(action);
  if (comm) {
    await adminAuth.assertModeratorCommunityAccess(moderatorId, comm);
    return;
  }
  throw new HttpError(403, "Appeal review for this action requires platform staff");
}

export async function resolveAffectedUserId(action: ModerationAction): Promise<string | null> {
  if (action.targetType === "user") {
    return action.targetId;
  }
  if (action.actionType === "restrict_user" || action.actionType === "warn_user") {
    return action.targetId;
  }
  if (action.targetType === "post") {
    const p = await prisma.post.findUnique({
      where: { id: action.targetId },
      select: { authorId: true },
    });
    return p?.authorId ?? null;
  }
  if (action.targetType === "comment") {
    const c = await prisma.comment.findUnique({
      where: { id: action.targetId },
      select: { authorId: true },
    });
    return c?.authorId ?? null;
  }
  return null;
}

async function assertAppealOpen(appeal: { status: AppealStatus }) {
  if (appeal.status !== AppealStatusEnum.open) {
    throw new HttpError(400, "Appeal is not open");
  }
}

export async function createAppealFromUser(appellantId: string, body: CreateAppealBody) {
  const action = await prisma.moderationAction.findUnique({
    where: { id: body.moderationActionId },
  });
  if (!action) {
    throw new HttpError(404, "Moderation action not found");
  }

  const affectedUserId = await resolveAffectedUserId(action);
  if (!affectedUserId || affectedUserId !== appellantId) {
    throw new HttpError(403, "You may only appeal moderation actions that apply to your account");
  }

  const existingOpen = await prisma.appeal.findFirst({
    where: {
      moderationActionId: action.id,
      status: AppealStatusEnum.open,
    },
  });
  if (existingOpen) {
    throw new HttpError(409, "An open appeal already exists for this moderation action");
  }

  return prisma.appeal.create({
    data: {
      moderationActionId: action.id,
      appellantId,
      appealText: body.appealText.trim(),
      status: AppealStatusEnum.open,
    },
    include: appealInclude,
  });
}

/**
 * Community-scoped appeal visibility for list queries (matches legacy OR semantics, without ID-set caps).
 *
 * An appeal is visible when the linked moderation action is tied to a moderatable community via any of:
 * - `moderation_actions.community_id` ∈ communities the moderator may moderate
 * - target is a post in one of those communities (handles null `community_id` on the action)
 * - target is a comment whose post is in one of those communities
 *
 * Platform staff skip this filter entirely (`listAppealsForAdmin`). Detail/review still uses
 * `assertCanReviewAppeal` (same resolution rules).
 *
 * Indexes: FK/index on `appeals.moderation_action_id`, `moderation_actions.community_id`,
 * PK lookups on `posts.id` / `comments.id`, `posts.community_id`, `comments.post_id`.
 * Optional: `@@index([status, createdAt(sort: Desc)])` on `appeals` for status-filtered queues.
 */
function communityModeratorAppealVisibilitySql(communityIds: string[]): Prisma.Sql {
  const ids = Prisma.join(communityIds.map((id) => Prisma.sql`${id}`));
  return Prisma.sql`(
    m.community_id IN (${ids})
    OR (
      LOWER(m.target_type) = 'post'
      AND EXISTS (
        SELECT 1 FROM posts p
        WHERE p.id = m.target_id AND p.community_id IN (${ids})
      )
    )
    OR (
      LOWER(m.target_type) = 'comment'
      AND EXISTS (
        SELECT 1 FROM comments c
        INNER JOIN posts p ON p.id = c.post_id
        WHERE c.id = m.target_id AND p.community_id IN (${ids})
      )
    )
  )`;
}

export async function listAppealsForAdmin(moderatorId: string, query: AdminAppealListQuery) {
  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const modCommunities = platform ? null : await adminAuth.listModeratableCommunityIds(moderatorId);
  if (!platform && (!modCommunities || modCommunities.length === 0)) {
    throw new HttpError(403, "Admin access denied");
  }

  const skip = (query.page - 1) * query.pageSize;

  if (platform) {
    const where: Prisma.AppealWhereInput = {};
    if (query.status && query.status !== "all") {
      where.status = query.status;
    }
    const [total, rows] = await prisma.$transaction([
      prisma.appeal.count({ where }),
      prisma.appeal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
        include: appealInclude,
      }),
    ]);
    return { total, page: query.page, pageSize: query.pageSize, appeals: rows.map(serializeAppealListItem) };
  }

  const visibilitySql = communityModeratorAppealVisibilitySql(modCommunities!);
  const statusFilter =
    query.status !== "all"
      ? Prisma.sql`AND a.status = ${query.status}::"AppealStatus"`
      : Prisma.sql``;

  const [countRows, idRows] = await prisma.$transaction([
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM appeals a
      INNER JOIN moderation_actions m ON m.id = a.moderation_action_id
      WHERE TRUE
      ${statusFilter}
      AND (${visibilitySql})
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT a.id
      FROM appeals a
      INNER JOIN moderation_actions m ON m.id = a.moderation_action_id
      WHERE TRUE
      ${statusFilter}
      AND (${visibilitySql})
      ORDER BY a.created_at DESC
      LIMIT ${query.pageSize} OFFSET ${skip}
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const ids = idRows.map((r) => r.id);
  if (ids.length === 0) {
    return { total, page: query.page, pageSize: query.pageSize, appeals: [] };
  }

  const rows = await prisma.appeal.findMany({
    where: { id: { in: ids } },
    include: appealInclude,
  });
  const order = new Map(ids.map((id, i) => [id, i] as const));
  rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return { total, page: query.page, pageSize: query.pageSize, appeals: rows.map(serializeAppealListItem) };
}

function serializeAppealListItem(row: AppealRow) {
  return {
    id: row.id,
    status: row.status,
    appealTextPreview: row.appealText.slice(0, 280),
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    appellant: row.appellant,
    moderationAction: {
      id: row.moderationAction.id,
      actionType: row.moderationAction.actionType,
      targetType: row.moderationAction.targetType,
      targetId: row.moderationAction.targetId,
      communityId: row.moderationAction.communityId,
      reasonCode: row.moderationAction.reasonCode,
      createdAt: row.moderationAction.createdAt.toISOString(),
    },
  };
}

function serializeModerationActionFull(m: AppealRow["moderationAction"]) {
  return {
    id: m.id,
    actionType: m.actionType,
    targetType: m.targetType,
    targetId: m.targetId,
    communityId: m.communityId,
    reasonCode: m.reasonCode,
    reasonText: m.reason,
    metadata: m.metadata ?? null,
    createdAt: m.createdAt.toISOString(),
    moderator: m.moderator,
    community: m.community,
  };
}

export async function getAppealDetailForAdmin(moderatorId: string, appealId: string) {
  const row = await prisma.appeal.findUnique({
    where: { id: appealId },
    include: appealInclude,
  });
  if (!row) {
    throw new HttpError(404, "Appeal not found");
  }
  await assertCanReviewAppeal(moderatorId, row.moderationAction);

  const affectedUserId = await resolveAffectedUserId(row.moderationAction);
  const relatedCurrentState = await buildRelatedCurrentState(row.moderationAction, affectedUserId);

  return {
    appeal: {
      id: row.id,
      status: row.status,
      appealText: row.appealText,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      decisionNote: row.decisionNote,
    },
    moderationAction: serializeModerationActionFull(row.moderationAction),
    targetSnapshot: await buildTargetSnapshot(row.moderationAction),
    appellant: row.appellant,
    reviewer: row.reviewedBy,
    relatedCurrentState,
    decisionOptions: {
      uphold: { description: "Confirm original moderation; no automatic state change." },
      reverse: {
        description: "Undo supported outcomes where safe (see MVP limits).",
        automaticForActionTypes: ["remove_post", "remove_comment", "restrict_user"],
      },
      modify: {
        description:
          "Record outcome. Lifting/creating restrictions only for restrict_user appeals; otherwise decision text only (or use reverse/uphold).",
      },
    },
  };
}

async function buildTargetSnapshot(action: ModerationAction) {
  if (action.targetType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: action.targetId },
      select: {
        id: true,
        title: true,
        body: true,
        communityId: true,
        authorId: true,
        deletedAt: true,
        deletionKind: true,
        createdAt: true,
      },
    });
    return post
      ? {
          kind: "post" as const,
          post: {
            ...post,
            createdAt: post.createdAt.toISOString(),
            deletedAt: post.deletedAt?.toISOString() ?? null,
          },
        }
      : { kind: "post" as const, post: null };
  }
  if (action.targetType === "comment") {
    const comment = await prisma.comment.findUnique({
      where: { id: action.targetId },
      select: {
        id: true,
        body: true,
        postId: true,
        authorId: true,
        deletedAt: true,
        deletionKind: true,
        createdAt: true,
      },
    });
    return comment
      ? {
          kind: "comment" as const,
          comment: {
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            deletedAt: comment.deletedAt?.toISOString() ?? null,
          },
        }
      : { kind: "comment" as const, comment: null };
  }
  if (action.targetType === "user") {
    const user = await prisma.user.findUnique({
      where: { id: action.targetId },
      select: { id: true, username: true, createdAt: true },
    });
    return user
      ? {
          kind: "user" as const,
          user: { ...user, createdAt: user.createdAt.toISOString() },
        }
      : { kind: "user" as const, user: null };
  }
  return { kind: "unknown" as const, targetType: action.targetType, targetId: action.targetId };
}

async function buildRelatedCurrentState(action: ModerationAction, affectedUserId: string | null) {
  const meta = (action.metadata && typeof action.metadata === "object" ? action.metadata : {}) as Record<
    string,
    unknown
  >;
  const restrictionId = typeof meta.restrictionId === "string" ? meta.restrictionId : null;
  let restriction = null as null | {
    id: string;
    isActive: boolean;
    restrictionType: string;
    endsAt: Date | null;
  };
  if (restrictionId) {
    restriction = await prisma.userRestriction.findUnique({
      where: { id: restrictionId },
      select: { id: true, isActive: true, restrictionType: true, endsAt: true },
    });
  }

  return {
    affectedUserId,
    linkedRestriction: restriction
      ? {
          ...restriction,
          endsAt: restriction.endsAt?.toISOString() ?? null,
        }
      : null,
    note: "Content purge removes rows; reversals are blocked if targets are gone.",
  };
}

/**
 * Decision flows (Phase 3.6): single Prisma transaction per outcome.
 *
 * Concurrency guard:
 * - `updateMany` with `status = open` claims the appeal exactly once.
 * - If another reviewer wins, `updateMany` updates 0 rows and we throw `409 APPEAL_ALREADY_DECIDED`.
 *
 * Transaction boundaries:
 * - Claim + side effects + final audit logging are all performed using the same transaction client.
 * - Any error after the claim rolls back the whole transaction, ensuring there is no “half-applied”
 *   outcome without a matching appeal status.
 *
 * **Uphold:** claim → `appeal_upheld` audit.
 * **Reverse:** claim → `applyReversalForModerationActionInTx` → `appeal_reversed` audit (see moderation-reversal MVP table).
 * **Modify:** claim → optional lifts/create restriction (restrict_user appeals only for structural) → `appeal_modified` audit.
 */
async function claimAppealForDecisionInTx(
  tx: Prisma.TransactionClient,
  appealId: string,
  newStatus: AppealStatusEnum,
  moderatorId: string,
  decisionNote: string
): Promise<AppealRow> {
  const claimed = await tx.appeal.updateMany({
    where: { id: appealId, status: AppealStatusEnum.open },
    data: {
      status: newStatus,
      reviewedById: moderatorId,
      reviewedAt: new Date(),
      decisionNote,
    },
  });

  throwUnlessAppealClaimed(claimed.count);

  const out = await tx.appeal.findUnique({
    where: { id: appealId },
    include: appealInclude,
  });
  if (!out) {
    throw new HttpError(500, "Appeal read failed after claim");
  }
  return out;
}

export async function upholdAppeal(moderatorId: string, appealId: string, body: { decisionNote: string }) {
  const appeal = await loadAppealForDecision(appealId);
  await assertCanReviewAppeal(moderatorId, appeal.moderationAction);
  await assertAppealOpen(appeal);

  const note = body.decisionNote;

  return prisma.$transaction(async (tx) => {
    const out = await claimAppealForDecisionInTx(tx, appealId, AppealStatusEnum.upheld, moderatorId, note);

    await moderationAudit.logModerationAction(
      {
        moderatorId,
        communityId: out.moderationAction.communityId,
        actionType: "appeal_upheld",
        targetType: "user",
        targetId: out.appellantId,
        reasonCode: "other",
        reasonText: note,
        metadata: { appealId: out.id },
      },
      tx
    );
    return out;
  });
}

export async function reverseAppeal(
  moderatorId: string,
  appealId: string,
  body: { decisionNote: string; reasonCode?: string }
) {
  const appeal = await loadAppealForDecision(appealId);
  await assertCanReviewAppeal(moderatorId, appeal.moderationAction);
  await assertAppealOpen(appeal);
  assertModerationActionReversibleForAppeal(appeal.moderationAction);

  const reasonCode = body.reasonCode ?? "other";
  const note = body.decisionNote;

  return prisma.$transaction(async (tx) => {
    const out = await claimAppealForDecisionInTx(tx, appealId, AppealStatusEnum.reversed, moderatorId, note);

    await applyReversalForModerationActionInTx(tx, {
      original: out.moderationAction,
      reviewerId: moderatorId,
      appealId: out.id,
      decisionNote: note,
      reasonCode,
    });

    await moderationAudit.logModerationAction(
      {
        moderatorId,
        communityId: out.moderationAction.communityId,
        actionType: "appeal_reversed",
        targetType: "user",
        targetId: out.appellantId,
        reasonCode,
        reasonText: note,
        metadata: { appealId: out.id },
      },
      tx
    );
    return out;
  });
}

export async function modifyAppeal(moderatorId: string, appealId: string, body: AppealModifyBody) {
  const appeal = await loadAppealForDecision(appealId);
  await assertCanReviewAppeal(moderatorId, appeal.moderationAction);
  await assertAppealOpen(appeal);

  const subjectUserId = await resolveAffectedUserId(appeal.moderationAction);
  if (!subjectUserId) {
    throw new HttpError(400, "Cannot resolve subject user for this appeal");
  }

  const hasStructural =
    (body.liftRestrictionIds?.length ?? 0) > 0 || Boolean(body.createReplacementRestriction);
  if (hasStructural && appeal.moderationAction.actionType !== "restrict_user") {
    throw new HttpError(
      400,
      "Lifting or creating restrictions via modify is only allowed for restrict_user appeals. Use reverse for removable content actions, or uphold with notes."
    );
  }

  const reasonCode = body.reasonCode ?? "other";
  const reasonText = body.reasonText?.trim() || null;

  if (body.liftRestrictionIds?.length) {
    await assertCanViewAdminUser(moderatorId, subjectUserId);
  }

  if (body.createReplacementRestriction) {
    await assertCanViewAdminUser(moderatorId, subjectUserId);
    const p = body.createReplacementRestriction;
    const scopeCommunityId = p.communityId?.trim() || null;
    await assertCanManageRestrictionScope(moderatorId, scopeCommunityId);
    const endsAt = p.endsAt ? new Date(p.endsAt) : null;
    if (p.restrictionType === UserRestrictionType.temp_suspend && !endsAt) {
      throw new HttpError(400, "endsAt is required for temp_suspend");
    }
  }

  return prisma.$transaction(async (tx) => {
    const out = await claimAppealForDecisionInTx(
      tx,
      appealId,
      AppealStatusEnum.modified,
      moderatorId,
      body.decisionNote
    );

    if (body.liftRestrictionIds?.length) {
      for (const rid of body.liftRestrictionIds) {
        await deactivateRestrictionTx(
          tx,
          moderatorId,
          rid,
          {
            reasonCode,
            reasonText: reasonText ?? `Appeal ${appeal.id} modified: ${body.decisionNote}`,
          },
          { idempotentIfInactive: true, expectedSubjectUserId: subjectUserId }
        );
      }
    }

    if (body.createReplacementRestriction) {
      const p = body.createReplacementRestriction;
      const scopeCommunityId = p.communityId?.trim() || null;
      const endsAt = p.endsAt ? new Date(p.endsAt) : null;
      const rtext = p.reasonText?.trim() || null;
      await createUserRestrictionWithAuditTx(tx, {
        subjectUserId,
        moderatorId,
        restrictionType: p.restrictionType,
        communityId: scopeCommunityId,
        reasonCode: p.reasonCode,
        reasonText: rtext,
        endsAt,
        relatedReportId: null,
      });
    }

    await moderationAudit.logModerationAction(
      {
        moderatorId,
        communityId: out.moderationAction.communityId,
        actionType: "appeal_modified",
        targetType: "user",
        targetId: out.appellantId,
        reasonCode,
        reasonText: body.decisionNote,
        metadata: { appealId: out.id },
      },
      tx
    );
    return out;
  });
}
