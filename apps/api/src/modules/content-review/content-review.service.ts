import type { Prisma } from "@prisma/client";
import { ReportStatus } from "@prisma/client";
import { deriveDeletionState } from "../../lib/content-deletion-state.js";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "../admin/admin-authorization.service.js";
import { computePostScore } from "../ranking/ranking.service.js";

async function ratingAggregate(targetType: string, targetId: string) {
  const rows = await prisma.rating.findMany({
    where: { targetType, targetId },
  });
  const n = rows.length;
  if (n === 0) {
    return {
      count: 0,
      averages: null as { clarity: number; evidence: number; kindness: number; novelty: number } | null,
    };
  }
  const sum = rows.reduce(
    (a, r) => ({
      clarity: a.clarity + r.clarity,
      evidence: a.evidence + r.evidence,
      kindness: a.kindness + r.kindness,
      novelty: a.novelty + r.novelty,
    }),
    { clarity: 0, evidence: 0, kindness: 0, novelty: 0 }
  );
  return {
    count: n,
    averages: {
      clarity: sum.clarity / n,
      evidence: sum.evidence / n,
      kindness: sum.kindness / n,
      novelty: sum.novelty / n,
    },
  };
}

function serializeModRow(m: {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reasonCode: string | null;
  reason: string | null;
  metadata: Prisma.JsonValue | null;
  communityId: string | null;
  createdAt: Date;
  moderator: { id: string; username: string } | null;
}) {
  return {
    id: m.id,
    actionType: m.actionType,
    targetType: m.targetType,
    targetId: m.targetId,
    moderator: m.moderator,
    reasonCode: m.reasonCode,
    reasonText: m.reason,
    metadata: m.metadata ?? null,
    createdAt: m.createdAt.toISOString(),
    communityId: m.communityId,
  };
}

export async function getPostReview(moderatorId: string, postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          reputationClarity: true,
          reputationEvidence: true,
          reputationKindness: true,
          reputationNovelty: true,
          createdAt: true,
        },
      },
      community: true,
    },
  });
  if (!post) throw new HttpError(404, "Post not found");

  await adminAuth.assertModeratorCommunityAccess(moderatorId, post.communityId);

  const reports = await prisma.report.findMany({
    where: { targetType: "post", targetId: post.id },
    orderBy: { createdAt: "desc" },
    include: { reporter: { select: { id: true, username: true } } },
  });

  const moderationHistory = await prisma.moderationAction.findMany({
    where: { targetType: "post", targetId: post.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { moderator: { select: { id: true, username: true } } },
  });

  const commentsPreview = await prisma.comment.findMany({
    where: { postId: post.id, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { author: { select: { id: true, username: true } } },
  });

  const ratingSummary = await ratingAggregate("post", post.id);

  const now = new Date();
  const rankingDebug = {
    feedScore: computePostScore(post, post.community, now),
    formula:
      "decay * dampened( weighted cached axes ); dampening applies when ratingCount < MIN_RATINGS_DAMPENING",
    inputs: {
      weights: {
        clarity: post.community.weightClarity,
        evidence: post.community.weightEvidence,
        kindness: post.community.weightKindness,
        novelty: post.community.weightNovelty,
      },
      decayHalfLifeSeconds: post.community.decayHalfLifeSeconds,
    },
  };

  return {
    post: {
      id: post.id,
      title: post.title,
      body: post.body,
      communityId: post.communityId,
      authorId: post.authorId,
      cachedClarity: post.cachedClarity,
      cachedEvidence: post.cachedEvidence,
      cachedKindness: post.cachedKindness,
      cachedNovelty: post.cachedNovelty,
      cachedScore: post.cachedScore,
      ratingCount: post.ratingCount,
      createdAt: post.createdAt.toISOString(),
      deletedAt: post.deletedAt?.toISOString() ?? null,
      deletionKind: post.deletionKind ?? null,
      deletionState: deriveDeletionState(post),
    },
    author: post.author
      ? {
          ...post.author,
          createdAt: post.author.createdAt.toISOString(),
        }
      : null,
    community: {
      id: post.community.id,
      name: post.community.name,
      slug: post.community.slug,
    },
    scoreSummary: {
      cachedClarity: post.cachedClarity,
      cachedEvidence: post.cachedEvidence,
      cachedKindness: post.cachedKindness,
      cachedNovelty: post.cachedNovelty,
      cachedScore: post.cachedScore,
      ratingCount: post.ratingCount,
    },
    reports: reports.map((r) => ({
      id: r.id,
      status: r.status,
      reasonCode: r.reasonCode,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
    })),
    moderationHistory: moderationHistory.map(serializeModRow),
    commentsPreview: commentsPreview.map((c) => ({
      id: c.id,
      bodyPreview: c.body.slice(0, 280),
      author: c.author,
      createdAt: c.createdAt.toISOString(),
      deletedAt: c.deletedAt?.toISOString() ?? null,
      deletionKind: c.deletionKind ?? null,
      deletionState: deriveDeletionState(c),
      ratingCount: c.ratingCount,
    })),
    ratingSummary,
    rankingDebug,
  };
}

export async function getCommentReview(moderatorId: string, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          reputationClarity: true,
          reputationEvidence: true,
          reputationKindness: true,
          reputationNovelty: true,
          createdAt: true,
        },
      },
    },
  });
  if (!comment) throw new HttpError(404, "Comment not found");

  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    include: { community: true },
  });
  if (!post) throw new HttpError(400, "Parent post not found");

  await adminAuth.assertModeratorCommunityAccess(moderatorId, post.communityId);

  const parentComment = comment.parentId
    ? await prisma.comment.findUnique({
        where: { id: comment.parentId },
        include: { author: { select: { id: true, username: true } } },
      })
    : null;

  const threadSiblings = comment.parentId
    ? await prisma.comment.findMany({
        where: { parentId: comment.parentId, NOT: { id: comment.id } },
        orderBy: { createdAt: "asc" },
        take: 12,
        include: { author: { select: { id: true, username: true } } },
      })
    : await prisma.comment.findMany({
        where: { postId: comment.postId, parentId: null, NOT: { id: comment.id } },
        orderBy: { createdAt: "asc" },
        take: 12,
        include: { author: { select: { id: true, username: true } } },
      });

  const openReportCount = await prisma.report.count({
    where: { targetType: "comment", targetId: comment.id, status: ReportStatus.open },
  });
  const reportsAll = await prisma.report.findMany({
    where: { targetType: "comment", targetId: comment.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { reporter: { select: { id: true, username: true } } },
  });

  const moderationHistory = await prisma.moderationAction.findMany({
    where: { targetType: "comment", targetId: comment.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { moderator: { select: { id: true, username: true } } },
  });

  const ratingSummary = await ratingAggregate("comment", comment.id);

  return {
    comment: {
      id: comment.id,
      body: comment.body,
      postId: comment.postId,
      authorId: comment.authorId,
      parentId: comment.parentId,
      cachedClarity: comment.cachedClarity,
      cachedEvidence: comment.cachedEvidence,
      cachedKindness: comment.cachedKindness,
      cachedNovelty: comment.cachedNovelty,
      cachedScore: comment.cachedScore,
      ratingCount: comment.ratingCount,
      createdAt: comment.createdAt.toISOString(),
      deletedAt: comment.deletedAt?.toISOString() ?? null,
      deletionKind: comment.deletionKind ?? null,
      deletionState: deriveDeletionState(comment),
    },
    parentComment: parentComment
      ? {
          id: parentComment.id,
          bodyPreview: parentComment.body.slice(0, 400),
          authorId: parentComment.authorId,
          author: parentComment.author,
          createdAt: parentComment.createdAt.toISOString(),
          deletedAt: parentComment.deletedAt?.toISOString() ?? null,
        }
      : null,
    post: {
      id: post.id,
      title: post.title,
      communityId: post.communityId,
      deletedAt: post.deletedAt?.toISOString() ?? null,
      deletionKind: post.deletionKind ?? null,
      deletionState: deriveDeletionState(post),
    },
    author: comment.author
      ? {
          ...comment.author,
          createdAt: comment.author.createdAt.toISOString(),
        }
      : null,
    scoreSummary: {
      cachedClarity: comment.cachedClarity,
      cachedEvidence: comment.cachedEvidence,
      cachedKindness: comment.cachedKindness,
      cachedNovelty: comment.cachedNovelty,
      cachedScore: comment.cachedScore,
      ratingCount: comment.ratingCount,
    },
    reports: reportsAll.map((r) => ({
      id: r.id,
      status: r.status,
      reasonCode: r.reasonCode,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
    })),
    moderationHistory: moderationHistory.map(serializeModRow),
    threadContext: {
      siblingsOrTopLevel: threadSiblings.map((c) => ({
        id: c.id,
        bodyPreview: c.body.slice(0, 200),
        author: c.author,
        createdAt: c.createdAt.toISOString(),
      })),
      openReportCount,
    },
    ratingSummary,
  };
}
