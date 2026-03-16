import type { Request, Response } from "express";
import * as commentsService from "./comments.service.js";
import { validateCreateCommentBody } from "./comments.schema.js";

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
  const result = validateCreateCommentBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  try {
    const comment = await commentsService.create(req.body);
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
