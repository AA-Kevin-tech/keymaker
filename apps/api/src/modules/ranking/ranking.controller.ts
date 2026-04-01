import type { Request, Response } from "express";
import * as rankingService from "./ranking.service.js";

export async function getFeed(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
  const offset = parseInt(req.query.offset as string, 10) || 0;

  const result = await rankingService.getFeed(slug, limit, offset);
  if (result === null) {
    res.status(404).json({ error: "Community not found" });
    return;
  }

  const { posts, community } = result;
  type PostItem = (typeof posts)[number];
  res.json({
    posts: posts.map((post: PostItem) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      communityId: post.communityId,
      community,
      authorId: post.authorId,
      author: post.author,
      cachedClarity: post.cachedClarity,
      cachedEvidence: post.cachedEvidence,
      cachedNovelty: post.cachedNovelty,
      cachedScore: post.cachedScore,
      ratingCount: post.ratingCount,
      createdAt: post.createdAt.toISOString(),
    })),
  });
}
