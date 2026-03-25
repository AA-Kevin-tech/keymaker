import type { Prisma, Report } from "@prisma/client";
import { ContentDeletionKind, UserRestrictionType } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import * as commentsService from "../comments/comments.service.js";
import * as postsService from "../posts/posts.service.js";
import { createUserRestrictionWithAuditTx } from "../user-restrictions/user-restrictions.service.js";
import * as adminAuth from "../admin/admin-authorization.service.js";
import type { ReportActionBody, ReportTargetType } from "../reports/reports.types.js";
import * as moderationAudit from "./moderation-audit.service.js";

/**
 * Resolves which community scopes a moderation log query for `by-target`.
 * `null` means platform-only (e.g. user targets, or missing content); only platform staff may read.
 */
export async function resolveCommunityScopeForModerationRead(
  targetType: string,
  targetId: string
): Promise<string | null> {
  const tt = targetType.toLowerCase();
  if (tt === "post") {
    const post = await prisma.post.findFirst({
      where: { id: targetId },
      select: { communityId: true },
    });
    if (!post) throw new HttpError(404, "Target not found");
    return post.communityId;
  }
  if (tt === "comment") {
    const comment = await prisma.comment.findFirst({
      where: { id: targetId },
      select: { postId: true },
    });
    if (!comment) throw new HttpError(404, "Target not found");
    const post = await prisma.post.findUnique({
      where: { id: comment.postId },
      select: { communityId: true },
    });
    if (!post) throw new HttpError(404, "Target not found");
    return post.communityId;
  }
  if (tt === "user") {
    return null;
  }
  if (tt === "report") {
    const report = await prisma.report.findUnique({
      where: { id: targetId },
      select: { targetType: true, targetId: true },
    });
    if (!report) throw new HttpError(404, "Target not found");
    return resolveCommunityScopeForModerationRead(
      report.targetType as ReportTargetType,
      report.targetId
    );
  }
  throw new HttpError(400, "Unsupported target type for moderation history");
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

async function resolveReportSubjectUserId(tx: Prisma.TransactionClient, report: Report): Promise<string> {
  if (report.targetType === "user") return report.targetId;
  if (report.targetType === "post") {
    const post = await tx.post.findUnique({
      where: { id: report.targetId },
      select: { authorId: true },
    });
    if (!post) throw new HttpError(400, "Report target post is missing");
    return post.authorId;
  }
  if (report.targetType === "comment") {
    const comment = await tx.comment.findUnique({
      where: { id: report.targetId },
      select: { authorId: true },
    });
    if (!comment) throw new HttpError(400, "Report target comment is missing");
    return comment.authorId;
  }
  throw new HttpError(400, "Unknown report target type");
}

/**
 * Side effects for resolving a report: content removal, warnings, restrictions, or escalation logging.
 * Caller is responsible for updating the report row (status / reviewedBy / reviewedAt) in the same transaction.
 */
export async function executeReportAction(
  tx: Prisma.TransactionClient,
  args: {
    report: Report;
    moderatorId: string;
    body: ReportActionBody;
    /** Used for moderation_actions.communityId and warn notes when the report has no implicit community. */
    communityIdForLog: string | null;
  }
): Promise<void> {
  const { report, moderatorId, body, communityIdForLog } = args;
  const reasonText = body.reasonText?.trim() || null;

  switch (body.actionType) {
    case "remove_post": {
      if (report.targetType !== "post") {
        throw new HttpError(400, "remove_post requires a post-targeted report");
      }
      const post = await tx.post.findUnique({
        where: { id: report.targetId },
        select: { id: true, communityId: true, authorId: true },
      });
      if (!post) throw new HttpError(404, "Post not found");
      await postsService.softDeleteTx(tx, post.id, ContentDeletionKind.moderator_removed);
      await moderationAudit.logModerationAction(
        {
          moderatorId,
          communityId: post.communityId,
          actionType: "remove_post",
          targetType: "post",
          targetId: post.id,
          reasonCode: body.reasonCode,
          reasonText,
          metadata: {
            relatedReportId: report.id,
            targetUserId: post.authorId,
          },
        },
        tx
      );
      return;
    }
    case "remove_comment": {
      if (report.targetType !== "comment") {
        throw new HttpError(400, "remove_comment requires a comment-targeted report");
      }
      const comment = await tx.comment.findUnique({
        where: { id: report.targetId },
        select: { id: true, postId: true, authorId: true },
      });
      if (!comment) throw new HttpError(404, "Comment not found");
      const post = await tx.post.findUnique({
        where: { id: comment.postId },
        select: { communityId: true },
      });
      if (!post) throw new HttpError(400, "Comment parent post is missing");
      await commentsService.softDeleteTx(tx, comment.id, ContentDeletionKind.moderator_removed);
      await moderationAudit.logModerationAction(
        {
          moderatorId,
          communityId: post.communityId,
          actionType: "remove_comment",
          targetType: "comment",
          targetId: comment.id,
          reasonCode: body.reasonCode,
          reasonText,
          metadata: {
            relatedReportId: report.id,
            targetUserId: comment.authorId,
          },
        },
        tx
      );
      return;
    }
    case "warn_user": {
      const userId = await resolveReportSubjectUserId(tx, report);
      const note = await tx.moderatorNote.create({
        data: {
          userId,
          moderatorId,
          communityId: communityIdForLog,
          noteText: reasonText ?? `Warning issued (${body.reasonCode})`,
        },
      });
      await moderationAudit.logModerationAction(
        {
          moderatorId,
          communityId: communityIdForLog,
          actionType: "warn_user",
          targetType: "user",
          targetId: userId,
          reasonCode: body.reasonCode,
          reasonText,
          metadata: {
            relatedReportId: report.id,
            targetUserId: userId,
            noteId: note.id,
          },
        },
        tx
      );
      return;
    }
    case "restrict_user": {
      const userId = await resolveReportSubjectUserId(tx, report);
      const p = body.params;
      if (!p?.restrictionType) {
        throw new HttpError(400, "params.restrictionType is required for restrict_user");
      }
      const endsAt = p.endsAt ? new Date(p.endsAt) : null;
      if (p.restrictionType === UserRestrictionType.temp_suspend && !endsAt) {
        throw new HttpError(400, "params.endsAt is required for temp_suspend");
      }
      const scopeCommunityId = p.communityId ?? communityIdForLog ?? null;
      await createUserRestrictionWithAuditTx(tx, {
        subjectUserId: userId,
        moderatorId,
        restrictionType: p.restrictionType,
        communityId: scopeCommunityId,
        reasonCode: body.reasonCode,
        reasonText,
        endsAt,
        relatedReportId: report.id,
      });
      return;
    }
    case "escalate": {
      await moderationAudit.logModerationAction(
        {
          moderatorId,
          communityId: communityIdForLog,
          actionType: "escalate",
          targetType: "report",
          targetId: report.id,
          reasonCode: body.reasonCode,
          reasonText,
          metadata: { relatedReportId: report.id },
        },
        tx
      );
      return;
    }
    default: {
      throw new HttpError(400, "Unsupported action type");
    }
  }
}

export async function removePostByModerator(args: {
  postId: string;
  moderatorId: string;
  reasonCode: string;
  reasonText: string | null;
}) {
  const post = await prisma.post.findFirst({
    where: { id: args.postId },
    select: { id: true, communityId: true, authorId: true },
  });
  if (!post) throw new HttpError(404, "Post not found");
  await adminAuth.assertModeratorCommunityAccess(args.moderatorId, post.communityId);
  await prisma.$transaction(async (tx) => {
    await postsService.softDeleteTx(tx, post.id, ContentDeletionKind.moderator_removed);
    await moderationAudit.logModerationAction(
      {
        moderatorId: args.moderatorId,
        communityId: post.communityId,
        actionType: "remove_post",
        targetType: "post",
        targetId: post.id,
        reasonCode: args.reasonCode,
        reasonText: args.reasonText,
        metadata: { targetUserId: post.authorId },
      },
      tx
    );
  });
  return postsService.getById(post.id, true);
}

export async function restorePostByModerator(args: {
  postId: string;
  moderatorId: string;
  reasonCode: string;
  reasonText: string | null;
}) {
  const post = await prisma.post.findFirst({
    where: { id: args.postId },
    select: { id: true, communityId: true, authorId: true },
  });
  if (!post) throw new HttpError(404, "Post not found");
  await adminAuth.assertModeratorCommunityAccess(args.moderatorId, post.communityId);
  await prisma.$transaction(async (tx) => {
    await restorePostByModeratorInTx(tx, {
      postId: args.postId,
      moderatorId: args.moderatorId,
      reasonCode: args.reasonCode,
      reasonText: args.reasonText,
    });
  });
  return postsService.getById(post.id, true);
}

export async function removeCommentByModerator(args: {
  commentId: string;
  moderatorId: string;
  reasonCode: string;
  reasonText: string | null;
}) {
  const comment = await prisma.comment.findFirst({
    where: { id: args.commentId },
    select: { id: true, postId: true, authorId: true },
  });
  if (!comment) throw new HttpError(404, "Comment not found");
  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    select: { communityId: true },
  });
  if (!post) throw new HttpError(400, "Parent post missing");
  await adminAuth.assertModeratorCommunityAccess(args.moderatorId, post.communityId);
  await prisma.$transaction(async (tx) => {
    await commentsService.softDeleteTx(tx, comment.id, ContentDeletionKind.moderator_removed);
    await moderationAudit.logModerationAction(
      {
        moderatorId: args.moderatorId,
        communityId: post.communityId,
        actionType: "remove_comment",
        targetType: "comment",
        targetId: comment.id,
        reasonCode: args.reasonCode,
        reasonText: args.reasonText,
        metadata: { targetUserId: comment.authorId },
      },
      tx
    );
  });
  return prisma.comment.findFirst({
    where: { id: comment.id },
    include: {
      author: { select: { id: true, username: true } },
      post: { select: { id: true, title: true, communityId: true } },
    },
  });
}

export async function restoreCommentByModerator(args: {
  commentId: string;
  moderatorId: string;
  reasonCode: string;
  reasonText: string | null;
}) {
  const comment = await prisma.comment.findFirst({
    where: { id: args.commentId },
    select: { id: true, postId: true, authorId: true },
  });
  if (!comment) throw new HttpError(404, "Comment not found");
  const post = await prisma.post.findUnique({
    where: { id: comment.postId },
    select: { communityId: true },
  });
  if (!post) throw new HttpError(400, "Parent post missing");
  await adminAuth.assertModeratorCommunityAccess(args.moderatorId, post.communityId);
  await prisma.$transaction(async (tx) => {
    await restoreCommentByModeratorInTx(tx, {
      commentId: args.commentId,
      moderatorId: args.moderatorId,
      reasonCode: args.reasonCode,
      reasonText: args.reasonText,
    });
  });
  return prisma.comment.findFirst({
    where: { id: comment.id },
    include: {
      author: { select: { id: true, username: true } },
      post: { select: { id: true, title: true, communityId: true } },
    },
  });
}

/** Restore post + audit inside an existing transaction (appeals). Idempotent if already active. */
export async function restorePostByModeratorInTx(
  tx: Prisma.TransactionClient,
  args: {
    postId: string;
    moderatorId: string;
    reasonCode: string;
    reasonText: string | null;
  }
): Promise<void> {
  const post = await tx.post.findFirst({
    where: { id: args.postId },
    select: {
      id: true,
      communityId: true,
      authorId: true,
      deletedAt: true,
      deletionKind: true,
    },
  });
  if (!post) {
    throw new HttpError(404, "Post not found");
  }
  await adminAuth.assertModeratorCommunityAccess(args.moderatorId, post.communityId);
  if (!post.deletedAt) {
    return;
  }
  if (post.deletionKind !== ContentDeletionKind.moderator_removed) {
    throw new HttpError(
      400,
      "Post was not removed by moderators; automatic restore is unsafe — use content tools manually"
    );
  }
  await postsService.restoreTx(tx, post.id);
  await moderationAudit.logModerationAction(
    {
      moderatorId: args.moderatorId,
      communityId: post.communityId,
      actionType: "restore_post",
      targetType: "post",
      targetId: post.id,
      reasonCode: args.reasonCode,
      reasonText: args.reasonText,
      metadata: { targetUserId: post.authorId },
    },
    tx
  );
}

/** Restore comment + audit inside an existing transaction (appeals). Idempotent if already active. */
export async function restoreCommentByModeratorInTx(
  tx: Prisma.TransactionClient,
  args: {
    commentId: string;
    moderatorId: string;
    reasonCode: string;
    reasonText: string | null;
  }
): Promise<void> {
  const comment = await tx.comment.findFirst({
    where: { id: args.commentId },
    select: { id: true, postId: true, authorId: true, deletedAt: true, deletionKind: true },
  });
  if (!comment) {
    throw new HttpError(404, "Comment not found");
  }
  const post = await tx.post.findUnique({
    where: { id: comment.postId },
    select: { communityId: true },
  });
  if (!post) {
    throw new HttpError(400, "Parent post missing");
  }
  await adminAuth.assertModeratorCommunityAccess(args.moderatorId, post.communityId);
  if (!comment.deletedAt) {
    return;
  }
  if (comment.deletionKind !== ContentDeletionKind.moderator_removed) {
    throw new HttpError(
      400,
      "Comment was not removed by moderators; automatic restore is unsafe — use content tools manually"
    );
  }
  await commentsService.restoreTx(tx, comment.id);
  await moderationAudit.logModerationAction(
    {
      moderatorId: args.moderatorId,
      communityId: post.communityId,
      actionType: "restore_comment",
      targetType: "comment",
      targetId: comment.id,
      reasonCode: args.reasonCode,
      reasonText: args.reasonText,
      metadata: { targetUserId: comment.authorId },
    },
    tx
  );
}
