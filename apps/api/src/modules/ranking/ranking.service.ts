import { prisma } from "../../db/prisma.js";
import { MIN_RATINGS_DAMPENING } from "@keymaker/shared";

/**
 * Compute feed score for a post. Readable formula: time decay * dampened content score.
 * - Time decay: 0.5^(ageSeconds / halfLifeSeconds)
 * - Content score: weighted sum of cached four dimensions
 * - Low-signal dampening: scale content score when ratingCount < MIN_RATINGS_DAMPENING
 */
export function computePostScore(
  post: {
    cachedClarity: number;
    cachedEvidence: number;
    cachedKindness: number;
    cachedNovelty: number;
    ratingCount: number;
    createdAt: Date;
  },
  community: {
    weightClarity: number;
    weightEvidence: number;
    weightKindness: number;
    weightNovelty: number;
    decayHalfLifeSeconds: number;
  },
  now: Date
): number {
  const ageSeconds = (now.getTime() - post.createdAt.getTime()) / 1000;
  const decay = Math.pow(0.5, ageSeconds / community.decayHalfLifeSeconds);

  const contentScore =
    community.weightClarity * post.cachedClarity +
    community.weightEvidence * post.cachedEvidence +
    community.weightKindness * post.cachedKindness +
    community.weightNovelty * post.cachedNovelty;

  const dampeningFactor =
    post.ratingCount < MIN_RATINGS_DAMPENING
      ? post.ratingCount / MIN_RATINGS_DAMPENING
      : 1;
  const dampenedContent = contentScore * dampeningFactor;

  return dampenedContent * decay;
}

export async function getFeed(communitySlug: string, limit = 20, offset = 0) {
  const community = await prisma.community.findUnique({ where: { slug: communitySlug } });
  if (!community) return null;

  const posts = await prisma.post.findMany({
    where: { communityId: community.id, deletedAt: null },
    include: { author: { select: { id: true, username: true } } },
  });

  const now = new Date();
  const withScore = posts.map((post) => ({
    post,
    score: computePostScore(post, community, now),
  }));
  withScore.sort((a, b) => b.score - a.score);

  const paginated = withScore.slice(offset, offset + limit);
  return paginated.map(({ post }) => post);
}
