import type { Request, Response } from "express";
import * as postsService from "./posts.service.js";
import { validateCreatePostBody, validateUpdatePostBody } from "./posts.schema.js";

function toPostResponse(post: Awaited<ReturnType<typeof postsService.getById>>) {
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    communityId: post.communityId,
    community: post.community,
    authorId: post.authorId,
    author: post.author,
    cachedClarity: post.cachedClarity,
    cachedEvidence: post.cachedEvidence,
    cachedKindness: post.cachedKindness,
    cachedNovelty: post.cachedNovelty,
    cachedScore: post.cachedScore,
    ratingCount: post.ratingCount,
    createdAt: post.createdAt.toISOString(),
    deletedAt: post.deletedAt?.toISOString() ?? null,
  };
}

export async function create(req: Request, res: Response): Promise<void> {
  const result = validateCreatePostBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  try {
    const post = await postsService.create(req.body);
    res.status(201).json(toPostResponse(post));
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await postsService.getById(id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(toPostResponse(post));
}

export async function update(req: Request, res: Response): Promise<void> {
  const result = validateUpdatePostBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  try {
    const post = await postsService.update(req.params.id, req.body);
    res.json(toPostResponse(post));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Update failed" });
  }
}
