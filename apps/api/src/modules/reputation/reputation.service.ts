import { prisma } from "../../db/prisma.js";

/**
 * Recompute a user's four reputation values from all ratings on their posts and comments.
 * Simple mean per dimension; no time decay in MVP.
 */
export async function recomputeForUser(userId: string): Promise<void> {
  const postIds = (await prisma.post.findMany({ where: { authorId: userId }, select: { id: true } })).map((p) => p.id);
  const commentIds = (await prisma.comment.findMany({ where: { authorId: userId }, select: { id: true } })).map(
    (c) => c.id
  );

  const postRatings = await prisma.rating.findMany({
    where: { targetType: "post", targetId: { in: postIds } },
    select: { clarity: true, evidence: true, kindness: true, novelty: true },
  });

  const commentRatings = await prisma.rating.findMany({
    where: { targetType: "comment", targetId: { in: commentIds } },
    select: { clarity: true, evidence: true, kindness: true, novelty: true },
  });

  const all = [...postRatings, ...commentRatings];
  if (all.length === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        reputationClarity: 0,
        reputationEvidence: 0,
        reputationKindness: 0,
        reputationNovelty: 0,
      },
    });
    return;
  }

  const sum = all.reduce(
    (acc, r) => ({
      clarity: acc.clarity + r.clarity,
      evidence: acc.evidence + r.evidence,
      kindness: acc.kindness + r.kindness,
      novelty: acc.novelty + r.novelty,
    }),
    { clarity: 0, evidence: 0, kindness: 0, novelty: 0 }
  );
  const n = all.length;
  await prisma.user.update({
    where: { id: userId },
    data: {
      reputationClarity: sum.clarity / n,
      reputationEvidence: sum.evidence / n,
      reputationKindness: sum.kindness / n,
      reputationNovelty: sum.novelty / n,
    },
  });
}
