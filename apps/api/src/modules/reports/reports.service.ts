import { Prisma, ReportStatus } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "../admin/admin-authorization.service.js";
import * as audit from "../moderation/moderation-audit.service.js";
import * as moderationService from "../moderation/moderation.service.js";
import type {
  AdminReportListQuery,
  CreateReportBody,
  DismissReportBody,
  ReportActionBody,
  ReportTargetType,
} from "./reports.types.js";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Sentinel ID so an empty moderator scope matches no rows. */
const EMPTY_SCOPE_ID = "__scope_empty__";

export type TargetContext = {
  communityId: string | null;
  authorId: string | null;
  preview: string;
};

export async function resolveTargetContext(
  targetType: ReportTargetType,
  targetId: string
): Promise<TargetContext> {
  if (targetType === "post") {
    const post = await prisma.post.findFirst({
      where: { id: targetId },
      select: { title: true, communityId: true, authorId: true },
    });
    if (!post) throw new HttpError(404, "Post not found");
    return {
      communityId: post.communityId,
      authorId: post.authorId,
      preview: post.title.slice(0, 200),
    };
  }
  if (targetType === "comment") {
    const comment = await prisma.comment.findFirst({
      where: { id: targetId },
      select: { body: true, authorId: true, postId: true },
    });
    if (!comment) throw new HttpError(404, "Comment not found");
    const post = await prisma.post.findUnique({
      where: { id: comment.postId },
      select: { communityId: true },
    });
    if (!post) throw new HttpError(400, "Comment parent post not found");
    return {
      communityId: post.communityId,
      authorId: comment.authorId,
      preview: comment.body.slice(0, 200),
    };
  }
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: { username: true },
  });
  if (!user) throw new HttpError(404, "User not found");
  return {
    communityId: null,
    authorId: targetId,
    preview: user.username,
  };
}

async function buildModeratorScopeWhere(moderatorId: string): Promise<Prisma.ReportWhereInput | undefined> {
  const platform = await adminAuth.isPlatformStaff(moderatorId);
  if (platform) return undefined;
  const commIds = await adminAuth.listModeratableCommunityIds(moderatorId);
  if (commIds.length === 0) return { id: EMPTY_SCOPE_ID };

  const allPostIds: string[] = [];
  for (const cid of commIds) {
    const posts = await prisma.post.findMany({
      where: { communityId: cid },
      select: { id: true },
    });
    allPostIds.push(...posts.map((p) => p.id));
  }
  if (allPostIds.length === 0) {
    return { id: EMPTY_SCOPE_ID };
  }
  const comments = await prisma.comment.findMany({
    where: { postId: { in: allPostIds } },
    select: { id: true },
  });
  return {
    OR: [
      { targetType: "post", targetId: { in: allPostIds } },
      { targetType: "comment", targetId: { in: comments.map((c) => c.id) } },
    ],
  };
}

async function buildCommunityFilterWhere(communityId: string): Promise<Prisma.ReportWhereInput> {
  const posts = await prisma.post.findMany({
    where: { communityId },
    select: { id: true },
  });
  const postIds = posts.map((p) => p.id);
  const comments = await prisma.comment.findMany({
    where: { postId: { in: postIds } },
    select: { id: true },
  });
  return {
    OR: [
      { targetType: "post", targetId: { in: postIds } },
      { targetType: "comment", targetId: { in: comments.map((c) => c.id) } },
    ],
  };
}

function userSummary(user: { id: string; username: string } | null) {
  if (!user) return null;
  return { id: user.id, username: user.username };
}

export async function createReport(reporterId: string, body: CreateReportBody) {
  if (body.targetType === "user" && body.targetId === reporterId) {
    throw new HttpError(400, "You cannot report yourself");
  }

  const ctx = await resolveTargetContext(body.targetType, body.targetId);
  if (ctx.authorId === reporterId) {
    throw new HttpError(400, "You cannot report your own content");
  }

  const duplicate = await prisma.report.findFirst({
    where: {
      reporterId,
      targetType: body.targetType,
      targetId: body.targetId,
      reasonCode: body.reasonCode,
      status: ReportStatus.open,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
  });
  if (duplicate) {
    throw new HttpError(409, "An open report already exists for this target and reason");
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType: body.targetType,
      targetId: body.targetId,
      reasonCode: body.reasonCode,
      reasonText: body.reasonText?.trim() || null,
      status: ReportStatus.open,
    },
    include: { reporter: { select: { id: true, username: true } } },
  });

  return report;
}

export async function listReportsAdmin(moderatorId: string, query: AdminReportListQuery) {
  const status =
    query.status === undefined ? ReportStatus.open : query.status === "all" ? undefined : query.status;

  const moderatorScope = await buildModeratorScopeWhere(moderatorId);

  const whereParts: Prisma.ReportWhereInput[] = [];
  if (moderatorScope) whereParts.push(moderatorScope);
  if (status) whereParts.push({ status });
  if (query.targetType) whereParts.push({ targetType: query.targetType });
  if (query.reasonCode) whereParts.push({ reasonCode: query.reasonCode });
  if (query.communityId) {
    if (!(await adminAuth.isPlatformStaff(moderatorId))) {
      const allowed = await adminAuth.listModeratableCommunityIds(moderatorId);
      if (!allowed.includes(query.communityId)) {
        throw new HttpError(403, "You cannot filter by that community");
      }
    }
    whereParts.push(await buildCommunityFilterWhere(query.communityId));
  }

  const where: Prisma.ReportWhereInput =
    whereParts.length === 0 ? {} : whereParts.length === 1 ? whereParts[0]! : { AND: whereParts };

  const page = query.page ?? 1;
  const pageSize = Math.min(query.pageSize ?? 20, 100);
  const orderDir = query.sort === "created_at_asc" ? "asc" : "desc";

  const [total, rows] = await prisma.$transaction([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: orderDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reporter: { select: { id: true, username: true } },
      },
    }),
  ]);

  const items = await Promise.all(
    rows.map(async (r) => {
      const ctx = await resolveTargetContext(r.targetType as ReportTargetType, r.targetId).catch(() => null);
      let targetAuthor: { id: string; username: string } | null = null;
      if (ctx?.authorId) {
        targetAuthor = await prisma.user.findUnique({
          where: { id: ctx.authorId },
          select: { id: true, username: true },
        });
      }
      const sameTargetCount = await prisma.report.count({
        where: { targetType: r.targetType, targetId: r.targetId },
      });
      let community: { id: string; name: string; slug: string } | null = null;
      if (ctx?.communityId) {
        community = await prisma.community.findUnique({
          where: { id: ctx.communityId },
          select: { id: true, name: true, slug: true },
        });
      }
      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reasonCode: r.reasonCode,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        reporter: userSummary(r.reporter),
        targetPreview: ctx?.preview ?? "(unavailable)",
        targetAuthor: userSummary(targetAuthor),
        community,
        reportsOnSameTargetCount: sameTargetCount,
      };
    })
  );

  return { items, page, pageSize, total };
}

export async function getReportDetailAdmin(moderatorId: string, reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, username: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
  });
  if (!report) throw new HttpError(404, "Report not found");

  const ctx = await resolveTargetContext(report.targetType as ReportTargetType, report.targetId);
  await adminAuth.assertModeratorCommunityAccess(moderatorId, ctx.communityId);

  const targetAuthor = ctx.authorId
    ? await prisma.user.findUnique({
        where: { id: ctx.authorId },
        select: {
          id: true,
          username: true,
          reputationClarity: true,
          reputationEvidence: true,
          reputationKindness: true,
          reputationNovelty: true,
          createdAt: true,
        },
      })
    : null;

  const community = ctx.communityId
    ? await prisma.community.findUnique({
        where: { id: ctx.communityId },
        select: {
          id: true,
          name: true,
          slug: true,
          weightClarity: true,
          weightEvidence: true,
          weightKindness: true,
          weightNovelty: true,
          decayHalfLifeSeconds: true,
        },
      })
    : null;

  let targetSnapshot: Record<string, unknown> | null = null;
  if (report.targetType === "post") {
    const post = await prisma.post.findFirst({
      where: { id: report.targetId },
      include: { author: { select: { id: true, username: true } } },
    });
    if (post) {
      targetSnapshot = {
        id: post.id,
        title: post.title,
        body: post.body,
        communityId: post.communityId,
        authorId: post.authorId,
        deletedAt: post.deletedAt?.toISOString() ?? null,
        cachedClarity: post.cachedClarity,
        cachedEvidence: post.cachedEvidence,
        cachedKindness: post.cachedKindness,
        cachedNovelty: post.cachedNovelty,
        cachedScore: post.cachedScore,
        ratingCount: post.ratingCount,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
      };
    }
  } else if (report.targetType === "comment") {
    const comment = await prisma.comment.findFirst({
      where: { id: report.targetId },
      include: { author: { select: { id: true, username: true } } },
    });
    if (comment) {
      targetSnapshot = {
        id: comment.id,
        body: comment.body,
        postId: comment.postId,
        authorId: comment.authorId,
        parentId: comment.parentId,
        deletedAt: comment.deletedAt?.toISOString() ?? null,
        cachedClarity: comment.cachedClarity,
        cachedEvidence: comment.cachedEvidence,
        cachedKindness: comment.cachedKindness,
        cachedNovelty: comment.cachedNovelty,
        cachedScore: comment.cachedScore,
        ratingCount: comment.ratingCount,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
      };
    }
  } else {
    const user = await prisma.user.findUnique({
      where: { id: report.targetId },
      select: {
        id: true,
        username: true,
        reputationClarity: true,
        reputationEvidence: true,
        reputationKindness: true,
        reputationNovelty: true,
        createdAt: true,
      },
    });
    targetSnapshot = user ? { ...user, createdAt: user.createdAt.toISOString() } : null;
  }

  const relatedReports = await prisma.report.findMany({
    where: {
      targetType: report.targetType,
      targetId: report.targetId,
      NOT: { id: report.id },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: { reporter: { select: { id: true, username: true } } },
  });

  const modHistory = await prisma.moderationAction.findMany({
    where: { targetType: report.targetType, targetId: report.targetId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { moderator: { select: { id: true, username: true } } },
  });

  let scoreSummary: Record<string, unknown> | null = null;
  let threadContext: Record<string, unknown> | null = null;

  if (report.targetType === "post") {
    const post = await prisma.post.findFirst({
      where: { id: report.targetId },
      select: {
        cachedClarity: true,
        cachedEvidence: true,
        cachedKindness: true,
        cachedNovelty: true,
        cachedScore: true,
        ratingCount: true,
      },
    });
    if (post) {
      scoreSummary = {
        cachedClarity: post.cachedClarity,
        cachedEvidence: post.cachedEvidence,
        cachedKindness: post.cachedKindness,
        cachedNovelty: post.cachedNovelty,
        cachedScore: post.cachedScore,
        ratingCount: post.ratingCount,
      };
    }
  } else if (report.targetType === "comment") {
    const comment = await prisma.comment.findFirst({
      where: { id: report.targetId },
      select: {
        cachedClarity: true,
        cachedEvidence: true,
        cachedKindness: true,
        cachedNovelty: true,
        cachedScore: true,
        ratingCount: true,
        postId: true,
        parentId: true,
      },
    });
    if (comment) {
      scoreSummary = {
        cachedClarity: comment.cachedClarity,
        cachedEvidence: comment.cachedEvidence,
        cachedKindness: comment.cachedKindness,
        cachedNovelty: comment.cachedNovelty,
        cachedScore: comment.cachedScore,
        ratingCount: comment.ratingCount,
      };
      const post = await prisma.post.findUnique({
        where: { id: comment.postId },
        select: { id: true, title: true },
      });
      const parent = comment.parentId
        ? await prisma.comment.findUnique({
            where: { id: comment.parentId },
            select: { id: true, body: true, authorId: true, createdAt: true },
          })
        : null;
      threadContext = {
        post,
        parentComment: parent
          ? {
              id: parent.id,
              bodyPreview: parent.body.slice(0, 280),
              authorId: parent.authorId,
              createdAt: parent.createdAt.toISOString(),
            }
          : null,
      };
    }
  }

  return {
    report: {
      id: report.id,
      reporter: userSummary(report.reporter),
      targetType: report.targetType,
      targetId: report.targetId,
      reasonCode: report.reasonCode,
      reasonText: report.reasonText,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      reviewedBy: userSummary(report.reviewedBy),
      reviewedAt: report.reviewedAt?.toISOString() ?? null,
    },
    targetAuthor,
    community,
    targetSnapshot,
    relatedReports: relatedReports.map((rr) => ({
      id: rr.id,
      status: rr.status,
      reasonCode: rr.reasonCode,
      createdAt: rr.createdAt.toISOString(),
      reporter: userSummary(rr.reporter),
    })),
    moderationHistory: modHistory.map((m) => ({
      id: m.id,
      actionType: m.actionType,
      targetType: m.targetType,
      targetId: m.targetId,
      moderator: userSummary(m.moderator),
      reasonCode: m.reasonCode,
      reasonText: m.reason,
      createdAt: m.createdAt.toISOString(),
      communityId: m.communityId,
    })),
    scoreSummary,
    threadContext,
  };
}

export async function dismissReport(moderatorId: string, reportId: string, body: DismissReportBody) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, "Report not found");
  if (report.status !== ReportStatus.open) {
    throw new HttpError(400, "Only open reports can be dismissed");
  }

  const ctx = await resolveTargetContext(report.targetType as ReportTargetType, report.targetId);
  await adminAuth.assertModeratorCommunityAccess(moderatorId, ctx.communityId);

  const reasonText = body.reasonText?.trim() || null;

  await prisma.$transaction(async (tx) => {
    await audit.recordModerationAction(
      {
        moderatorId,
        communityId: ctx.communityId,
        actionType: "dismiss_report",
        targetType: "report",
        targetId: report.id,
        reasonCode: "other",
        reasonText,
      },
      tx
    );
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.dismissed,
        reviewedById: moderatorId,
        reviewedAt: new Date(),
      },
    });
  });

  return getReportDetailAdmin(moderatorId, reportId);
}

export async function actionReport(moderatorId: string, reportId: string, body: ReportActionBody) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new HttpError(404, "Report not found");
  if (report.status !== ReportStatus.open) {
    throw new HttpError(400, "Only open reports can be actioned");
  }

  const ctx = await resolveTargetContext(report.targetType as ReportTargetType, report.targetId);
  await adminAuth.assertModeratorCommunityAccess(moderatorId, ctx.communityId);

  await prisma.$transaction(async (tx) => {
    await moderationService.executeReportAction(tx, {
      report,
      moderatorId,
      body,
      communityIdForLog: ctx.communityId,
    });
    await tx.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.actioned,
        reviewedById: moderatorId,
        reviewedAt: new Date(),
      },
    });
  });

  return getReportDetailAdmin(moderatorId, reportId);
}
