import type { Request, Response } from "express";
import * as commentsService from "./comments.service.js";

function toCommentResponse(c: Awaited<ReturnType<typeof commentsService.create>>) {
  return {
    id: c.id,
    body: c.body,
    postId: c.postId,
    authorId: c.authorId,
    parentId: c.parentId,
    author: c.author,
    cachedClarity: c.cachedClarity,
    cachedEvidence: c.cachedEvidence,
    cachedKindness: c.cachedKindness,
    cachedNovelty: c.cachedNovelty,
    cachedScore: c.cachedScore,
    ratingCount: c.ratingCount,
    createdAt: c.createdAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
  };
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const comment = await commentsService.create({
      ...req.body,
      authorId: req.user.id,
    });
    res.status(201).json(toCommentResponse(comment));
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
  }
}

export async function listByPostId(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;
  const comments = await commentsService.listByPostId(postId);
  res.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      postId: c.postId,
      authorId: c.authorId,
      parentId: c.parentId,
      author: c.author,
      cachedClarity: c.cachedClarity,
      cachedEvidence: c.cachedEvidence,
      cachedKindness: c.cachedKindness,
      cachedNovelty: c.cachedNovelty,
      cachedScore: c.cachedScore,
      ratingCount: c.ratingCount,
      createdAt: c.createdAt.toISOString(),
      deletedAt: c.deletedAt?.toISOString() ?? null,
    })),
  });
}

function toCommentResponseFromComment(
  c: Awaited<ReturnType<typeof commentsService.getById>>
) {
  if (!c) return null;
  return {
    id: c.id,
    body: c.body,
    postId: c.postId,
    authorId: c.authorId,
    parentId: c.parentId,
    author: c.author,
    cachedClarity: c.cachedClarity,
    cachedEvidence: c.cachedEvidence,
    cachedKindness: c.cachedKindness,
    cachedNovelty: c.cachedNovelty,
    cachedScore: c.cachedScore,
    ratingCount: c.ratingCount,
    createdAt: c.createdAt.toISOString(),
    deletedAt: c.deletedAt?.toISOString() ?? null,
  };
}

export async function hide(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await commentsService.getById(req.params.id, true);
    if (!existing || existing.authorId !== req.user.id) {
      res.status(403).json({ error: "Only the author can hide this comment" });
      return;
    }
    const comment = await commentsService.softDelete(req.params.id);
    res.json(toCommentResponseFromComment(comment));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Hide failed" });
  }
}

export async function restoreComment(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await commentsService.getById(req.params.id, true);
    if (!existing || existing.authorId !== req.user.id) {
      res.status(403).json({ error: "Only the author can restore this comment" });
      return;
    }
    const comment = await commentsService.restore(req.params.id);
    res.json(toCommentResponseFromComment(comment));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Restore failed" });
  }
}
