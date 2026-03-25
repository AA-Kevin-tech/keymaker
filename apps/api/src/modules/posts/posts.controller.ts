import type { Request, Response } from "express";
import { ContentDeletionKind } from "@prisma/client";
import { deriveDeletionState } from "../../lib/content-deletion-state.js";
import * as postsService from "./posts.service.js";

function toPostResponse(
  post: NonNullable<Awaited<ReturnType<typeof postsService.getById>>> | Awaited<ReturnType<typeof postsService.softDeleteByAuthor>>
) {
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
    deletionKind: post.deletionKind ?? null,
    deletionState: deriveDeletionState(post),
  };
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const post = await postsService.create({
      ...req.body,
      authorId: req.user.id,
    });
    res.status(201).json(toPostResponse(post));
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Create failed" });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const includeDeleted = req.query.includeDeleted === "true" || req.query.includeDeleted === "1";
  const post = await postsService.getById(id, includeDeleted);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (post.deletedAt && (!req.user || req.user.id !== post.authorId)) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(toPostResponse(post));
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await postsService.getById(req.params.id, true);
    if (!existing || existing.authorId !== req.user.id) {
      res.status(403).json({ error: "Only the author can update this post" });
      return;
    }
    const post = await postsService.update(req.params.id, req.body);
    res.json(toPostResponse(post));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Update failed" });
  }
}

export async function hide(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await postsService.getById(req.params.id, true);
    if (!existing || existing.authorId !== req.user.id) {
      res.status(403).json({ error: "Only the author can hide this post" });
      return;
    }
    const post = await postsService.softDeleteByAuthor(req.params.id);
    res.json(toPostResponse(post));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Hide failed" });
  }
}

export async function restorePost(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await postsService.getById(req.params.id, true);
    if (!existing || existing.authorId !== req.user.id) {
      res.status(403).json({ error: "Only the author can restore this post" });
      return;
    }
    if (!existing.deletedAt) {
      res.status(400).json({ error: "Post is not deleted" });
      return;
    }
    if (existing.deletionKind === ContentDeletionKind.moderator_removed) {
      res.status(403).json({
        error: "This post was removed by moderators; it cannot be restored by the author",
      });
      return;
    }
    const post = await postsService.restore(req.params.id);
    res.json(toPostResponse(post));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Restore failed" });
  }
}

/** Author-initiated soft delete (same persistence as `POST .../hide`). Preserves ratings and moderation history. */
export async function authorDelete(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const existing = await postsService.getById(req.params.id, true);
    if (!existing || existing.authorId !== req.user.id) {
      res.status(403).json({ error: "Only the author can delete this post" });
      return;
    }
    const post = await postsService.softDeleteByAuthor(req.params.id);
    res.json(toPostResponse(post));
  } catch (e) {
    res.status(404).json({ error: e instanceof Error ? e.message : "Delete failed" });
  }
}
