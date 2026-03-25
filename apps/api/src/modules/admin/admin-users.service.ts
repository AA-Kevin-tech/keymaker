import type { ModeratorRoleName, Prisma } from "@prisma/client";
import { ReportStatus } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "./admin-authorization.service.js";
import {
  assertCanViewAdminUser,
  getEffectiveModerationState,
  listRestrictionsForAdminView,
} from "../user-restrictions/user-restrictions.service.js";
import type { AdminUserListQueryInput } from "./admin-users.schema.js";
import * as moderatorNotesService from "../moderator-notes/moderator-notes.service.js";
import * as moderationAudit from "../moderation/moderation-audit.service.js";

const userListSelect = {
  id: true,
  username: true,
  email: true,
  createdAt: true,
  reputationClarity: true,
  reputationEvidence: true,
  reputationKindness: true,
  reputationNovelty: true,
} as const;

async function buildUserWhereForModerator(
  moderatorId: string,
  query: AdminUserListQueryInput
): Promise<Prisma.UserWhereInput> {
  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const modCommunities = platform ? null : await adminAuth.listModeratableCommunityIds(moderatorId);
  if (!platform && (!modCommunities || modCommunities.length === 0)) {
    throw new HttpError(403, "Admin access denied");
  }

  const and: Prisma.UserWhereInput[] = [];

  if (!platform && modCommunities) {
    and.push({
      OR: [
        { posts: { some: { communityId: { in: modCommunities } } } },
        { restrictionsSubject: { some: { communityId: { in: modCommunities } } } },
        { comments: { some: { post: { communityId: { in: modCommunities } } } } },
      ],
    });
  }

  if (query.hasActiveRestrictions === true) {
    and.push({
      restrictionsSubject: {
        some: { isActive: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      },
    });
  }
  if (query.hasActiveRestrictions === false) {
    and.push({
      restrictionsSubject: {
        none: { isActive: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      },
    });
  }

  if (query.role) {
    and.push({
      moderatorRoles: { some: { roleName: query.role as ModeratorRoleName } },
    });
  }

  if (query.communityId) {
    if (!platform) {
      await adminAuth.assertModeratorCommunityAccess(moderatorId, query.communityId);
    }
    and.push({
      OR: [
        { posts: { some: { communityId: query.communityId } } },
        { restrictionsSubject: { some: { communityId: query.communityId } } },
        { comments: { some: { post: { communityId: query.communityId } } } },
      ],
    });
  }

  if (query.recentModerationDays) {
    const since = new Date(Date.now() - query.recentModerationDays * 86400000);
    const userIdsReported = await prisma.report.findMany({
      where: { targetType: "user", createdAt: { gte: since } },
      select: { targetId: true },
      distinct: ["targetId"],
    });
    and.push({
      OR: [
        { restrictionsSubject: { some: { createdAt: { gte: since } } } },
        ...(userIdsReported.length > 0
          ? [{ id: { in: userIdsReported.map((r) => r.targetId) } }]
          : []),
      ],
    });
  }

  if (query.search?.trim()) {
    const q = query.search.trim();
    and.push({
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listAdminUsers(moderatorId: string, query: AdminUserListQueryInput) {
  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const where = await buildUserWhereForModerator(moderatorId, query);
  const skip = (query.page - 1) * query.pageSize;

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        ...userListSelect,
        restrictionsSubject: {
          where: {
            isActive: true,
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
          take: 5,
          select: {
            id: true,
            restrictionType: true,
            communityId: true,
            endsAt: true,
          },
        },
        _count: {
          select: {
            reportsFiled: true,
            restrictionsSubject: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
  ]);

  const rows = await Promise.all(
    users.map(async (u) => {
      const reportsAgainst = await prisma.report.count({
        where: { targetType: "user", targetId: u.id },
      });
      const openReportsAgainst = await prisma.report.count({
        where: { targetType: "user", targetId: u.id, status: ReportStatus.open },
      });
      return {
        id: u.id,
        username: u.username,
        createdAt: u.createdAt.toISOString(),
        reputationClarity: u.reputationClarity,
        reputationEvidence: u.reputationEvidence,
        reputationKindness: u.reputationKindness,
        reputationNovelty: u.reputationNovelty,
        ...(platform ? { email: u.email } : {}),
        activeRestrictionSummary: u.restrictionsSubject.map((r) => ({
          id: r.id,
          restrictionType: r.restrictionType,
          communityId: r.communityId,
          endsAt: r.endsAt?.toISOString() ?? null,
        })),
        counts: {
          reportsFiledByUser: u._count.reportsFiled,
          reportsAgainstUser: reportsAgainst,
          openReportsAgainstUser: openReportsAgainst,
          activeRestrictions: u._count.restrictionsSubject,
        },
      };
    })
  );

  return { total, page: query.page, pageSize: query.pageSize, users: rows };
}

export async function getAdminUserDetail(moderatorId: string, userId: string) {
  await assertCanViewAdminUser(moderatorId, userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      reputationClarity: true,
      reputationEvidence: true,
      reputationKindness: true,
      reputationNovelty: true,
    },
  });
  if (!user) throw new HttpError(404, "User not found");

  const restrictions = await listRestrictionsForAdminView(moderatorId, userId);
  const effectiveModerationState = await getEffectiveModerationState(userId);
  const moderatorNotes = await moderatorNotesService.listNotesForAdminUser(moderatorId, userId);

  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const modCommunities = platform ? null : await adminAuth.listModeratableCommunityIds(moderatorId!);

  const userPostIds = await prisma.post.findMany({
    where: platform ? { authorId: userId } : { authorId: userId, communityId: { in: modCommunities ?? [] } },
    select: { id: true },
    take: 200,
  });
  const postIdList = userPostIds.map((p) => p.id);

  const userCommentIds = await prisma.comment.findMany({
    where: platform
      ? { authorId: userId }
      : { authorId: userId, post: { communityId: { in: modCommunities ?? [] } } },
    select: { id: true },
    take: 200,
  });
  const commentIdList = userCommentIds.map((c) => c.id);

  const modWhere: Prisma.ModerationActionWhereInput = {
    OR: [
      { targetType: "user", targetId: userId },
      { targetType: "post", targetId: { in: postIdList.length ? postIdList : ["__none__"] } },
      { targetType: "comment", targetId: { in: commentIdList.length ? commentIdList : ["__none__"] } },
      { metadata: { path: ["targetUserId"], equals: userId } },
    ],
  };
  if (!platform && modCommunities) {
    modWhere.AND = [
      {
        OR: [
          { communityId: { in: modCommunities } },
          {
            AND: [{ communityId: null }, { targetType: "user" }, { targetId: userId }],
          },
        ],
      },
    ];
  }

  const moderationHistory = await prisma.moderationAction.findMany({
    where: modWhere,
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { moderator: { select: { id: true, username: true } } },
  });

  const reportsAgainst = await prisma.report.findMany({
    where: { targetType: "user", targetId: userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { reporter: { select: { id: true, username: true } } },
  });

  const reportsFiled = await prisma.report.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { reporter: { select: { id: true, username: true } } },
  });

  const recentPosts = await prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      title: true,
      communityId: true,
      createdAt: true,
      deletedAt: true,
      deletionKind: true,
      cachedClarity: true,
      ratingCount: true,
    },
  });

  const recentComments = await prisma.comment.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      postId: true,
      body: true,
      createdAt: true,
      deletedAt: true,
      deletionKind: true,
    },
  });

  const communityParticipation = await prisma.post.groupBy({
    by: ["communityId"],
    where: { authorId: userId },
    _count: { id: true },
  });
  const commIds = communityParticipation.map((c) => c.communityId);
  const communities = await prisma.community.findMany({
    where: { id: { in: commIds } },
    select: { id: true, name: true, slug: true },
  });
  const commMap = new Map(communities.map((c) => [c.id, c]));

  const warnCount = await prisma.moderationAction.count({
    where: { actionType: "warn_user", targetType: "user", targetId: userId },
  });
  const lastWarn = await prisma.moderationAction.findFirst({
    where: { actionType: "warn_user", targetType: "user", targetId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      ...(platform ? { email: user.email } : {}),
      createdAt: user.createdAt.toISOString(),
    },
    reputationSummary: {
      clarity: user.reputationClarity,
      evidence: user.reputationEvidence,
      kindness: user.reputationKindness,
      novelty: user.reputationNovelty,
    },
    effectiveModerationState,
    activeRestrictions: restrictions.active,
    restrictionHistory: restrictions.all,
    moderatorNotes,
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
    reportsAgainst: reportsAgainst.map((r) => ({
      id: r.id,
      status: r.status,
      reasonCode: r.reasonCode,
      reasonText: r.reasonText,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
    })),
    reportsFiledByUser: reportsFiled.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      status: r.status,
      reasonCode: r.reasonCode,
      createdAt: r.createdAt.toISOString(),
    })),
    recentPosts: recentPosts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      deletedAt: p.deletedAt?.toISOString() ?? null,
    })),
    recentComments: recentComments.map((c) => ({
      id: c.id,
      postId: c.postId,
      bodyPreview: c.body.slice(0, 280),
      createdAt: c.createdAt.toISOString(),
      deletedAt: c.deletedAt?.toISOString() ?? null,
      deletionKind: c.deletionKind,
    })),
    communityParticipationSummary: communityParticipation.map((row) => ({
      community: commMap.get(row.communityId) ?? { id: row.communityId, name: "", slug: "" },
      postCount: row._count.id,
    })),
    warningsSummary: {
      warnActionCount: warnCount,
      lastWarnAt: lastWarn?.createdAt.toISOString() ?? null,
    },
  };
}

/** Direct warn from admin user page (moderator note + moderation_actions warn_user). */
export async function warnUserFromAdmin(
  moderatorId: string,
  subjectUserId: string,
  body: {
    reasonCode: string;
    reasonText?: string | null;
    communityId?: string | null;
    addModeratorNote?: boolean;
  }
) {
  await assertCanViewAdminUser(moderatorId, subjectUserId);
  const user = await prisma.user.findUnique({ where: { id: subjectUserId }, select: { id: true } });
  if (!user) throw new HttpError(404, "User not found");

  const communityId = body.communityId?.trim() || null;
  if (communityId) {
    await adminAuth.assertModeratorCommunityAccess(moderatorId, communityId);
  } else if (!(await adminAuth.isPlatformStaff(moderatorId))) {
    throw new HttpError(403, "Community moderators must specify communityId for warnings");
  }

  const reasonText = body.reasonText?.trim() || null;

  return prisma.$transaction(async (tx) => {
    let noteId: string | undefined;
    if (body.addModeratorNote !== false) {
      const note = await tx.moderatorNote.create({
        data: {
          userId: subjectUserId,
          moderatorId,
          communityId,
          noteText: reasonText ?? `Warning issued (${body.reasonCode})`,
        },
      });
      noteId = note.id;
    }

    await moderationAudit.logModerationAction(
      {
        moderatorId,
        communityId,
        actionType: "warn_user",
        targetType: "user",
        targetId: subjectUserId,
        reasonCode: body.reasonCode,
        reasonText,
        metadata:
          noteId !== undefined
            ? { noteId, targetUserId: subjectUserId }
            : { targetUserId: subjectUserId },
      },
      tx
    );

    return { ok: true, moderatorNoteId: noteId ?? null };
  });
}
