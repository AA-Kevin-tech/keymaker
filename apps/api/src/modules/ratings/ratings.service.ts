import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import type { UpsertRatingBody } from "./ratings.types.js";
import { recomputeForTarget } from "../aggregates/aggregate.service.js";
import { recomputeForUser } from "../reputation/reputation.service.js";
import type { TargetType } from "@keymaker/shared";
import {
  assertUserMayRateInCommunity,
  resolveCommunityIdForRatingTarget,
} from "../user-restrictions/restriction-enforcement.service.js";

export async function upsertRating(body: UpsertRatingBody) {
  const communityId = await resolveCommunityIdForRatingTarget(
    body.targetType as "post" | "comment",
    body.targetId
  );
  if (communityId === null) {
    throw new HttpError(404, "Rating target not found");
  }
  await assertUserMayRateInCommunity(body.raterId, communityId);

  const rating = await prisma.rating.upsert({
    where: {
      targetType_targetId_raterId: {
        targetType: body.targetType,
        targetId: body.targetId,
        raterId: body.raterId,
      },
    },
    update: {
      clarity: body.clarity,
      evidence: body.evidence,
      novelty: body.novelty,
    },
    create: {
      targetType: body.targetType,
      targetId: body.targetId,
      raterId: body.raterId,
      clarity: body.clarity,
      evidence: body.evidence,
      novelty: body.novelty,
    },
  });

  await recomputeForTarget(body.targetType as TargetType, body.targetId);

  const authorId = await getAuthorIdForTarget(body.targetType as TargetType, body.targetId);
  if (authorId) {
    await recomputeForUser(authorId);
  }

  return rating;
}

async function getAuthorIdForTarget(targetType: TargetType, targetId: string): Promise<string | null> {
  if (targetType === "post") {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { authorId: true } });
    return post?.authorId ?? null;
  }
  const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { authorId: true } });
  return comment?.authorId ?? null;
}
