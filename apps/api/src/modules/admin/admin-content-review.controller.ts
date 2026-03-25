import type { NextFunction, Request, Response } from "express";
import { deriveDeletionState } from "../../lib/content-deletion-state.js";
import * as contentReviewService from "../content-review/content-review.service.js";
import * as moderationService from "../moderation/moderation.service.js";

function toPostSummary(
  post: Awaited<ReturnType<typeof moderationService.removePostByModerator>>
) {
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    communityId: post.communityId,
    authorId: post.authorId,
    deletedAt: post.deletedAt?.toISOString() ?? null,
    deletionKind: post.deletionKind ?? null,
    deletionState: deriveDeletionState(post),
    cachedClarity: post.cachedClarity,
    cachedEvidence: post.cachedEvidence,
    cachedKindness: post.cachedKindness,
    cachedNovelty: post.cachedNovelty,
    cachedScore: post.cachedScore,
    ratingCount: post.ratingCount,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    community: post.community,
  };
}

export async function getPostReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const payload = await contentReviewService.getPostReview(req.user.id, req.params.id);
    res.json(payload);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function getCommentReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const payload = await contentReviewService.getCommentReview(req.user.id, req.params.id);
    res.json(payload);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function removePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { reasonCode, reasonText } = req.body as { reasonCode: string; reasonText?: string | null };
    const post = await moderationService.removePostByModerator({
      postId: req.params.id,
      moderatorId: req.user.id,
      reasonCode,
      reasonText: reasonText ?? null,
    });
    res.json({ post: toPostSummary(post), message: "Post removed" });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function removeComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { reasonCode, reasonText } = req.body as { reasonCode: string; reasonText?: string | null };
    await moderationService.removeCommentByModerator({
      commentId: req.params.id,
      moderatorId: req.user.id,
      reasonCode,
      reasonText: reasonText ?? null,
    });
    const review = await contentReviewService.getCommentReview(req.user.id, req.params.id);
    res.json({ comment: review.comment, message: "Comment removed" });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function restorePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { reasonCode, reasonText } = req.body as { reasonCode: string; reasonText?: string | null };
    const post = await moderationService.restorePostByModerator({
      postId: req.params.id,
      moderatorId: req.user.id,
      reasonCode,
      reasonText: reasonText ?? null,
    });
    res.json({ post: toPostSummary(post), message: "Post restored" });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function restoreComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { reasonCode, reasonText } = req.body as { reasonCode: string; reasonText?: string | null };
    const comment = await moderationService.restoreCommentByModerator({
      commentId: req.params.id,
      moderatorId: req.user.id,
      reasonCode,
      reasonText: reasonText ?? null,
    });
    res.json({
      comment: comment
        ? {
            id: comment.id,
            postId: comment.postId,
            deletedAt: comment.deletedAt?.toISOString() ?? null,
          }
        : null,
      message: "Comment restored",
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
