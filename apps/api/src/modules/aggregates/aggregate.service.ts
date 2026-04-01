import { prisma } from "../../db/prisma.js";
import type { TargetType } from "@keymaker/shared";

/**
 * Recompute aggregate averages for a post or comment from all its ratings.
 * Updates cached* and ratingCount. Used only by the ratings flow.
 */
export async function recomputeForTarget(targetType: TargetType, targetId: string): Promise<void> {
  const ratings = await prisma.rating.findMany({
    where: { targetType, targetId },
  });

  const count = ratings.length;
  if (count === 0) {
    const defaults = {
      cachedClarity: 0,
      cachedEvidence: 0,
      cachedNovelty: 0,
      cachedScore: 0,
      ratingCount: 0,
    };
    if (targetType === "post") {
      await prisma.post.update({ where: { id: targetId }, data: defaults });
    } else {
      await prisma.comment.update({ where: { id: targetId }, data: defaults });
    }
    return;
  }

  type Sum = { clarity: number; evidence: number; novelty: number };
  type RatingRow = (typeof ratings)[number];
  const sum = ratings.reduce(
    (acc: Sum, r: RatingRow) => ({
      clarity: acc.clarity + r.clarity,
      evidence: acc.evidence + r.evidence,
      novelty: acc.novelty + r.novelty,
    }),
    { clarity: 0, evidence: 0, novelty: 0 } satisfies Sum
  );
  const cachedClarity = sum.clarity / count;
  const cachedEvidence = sum.evidence / count;
  const cachedNovelty = sum.novelty / count;
  const cachedScore = cachedClarity + cachedEvidence + cachedNovelty;

  const data = {
    cachedClarity,
    cachedEvidence,
    cachedNovelty,
    cachedScore,
    ratingCount: count,
  };

  if (targetType === "post") {
    await prisma.post.update({ where: { id: targetId }, data });
  } else {
    await prisma.comment.update({ where: { id: targetId }, data });
  }
}
