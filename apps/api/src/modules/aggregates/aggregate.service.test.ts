import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../db/prisma.js";
import { recomputeForTarget } from "./aggregate.service.js";

describe("aggregate.service", () => {
  let userId: string;
  let raterId: string;
  let communityId: string;
  let postId: string;
  let commentId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: `agg-user-${Date.now()}`,
        passwordHash: "hash",
      },
    });
    userId = user.id;
    const rater = await prisma.user.create({
      data: { username: `agg-rater-${Date.now()}`, passwordHash: "hash" },
    });
    raterId = rater.id;
    const community = await prisma.community.create({
      data: { name: "Agg Test", slug: `agg-${Date.now()}` },
    });
    communityId = community.id;
    const post = await prisma.post.create({
      data: { title: "Post", body: "Body", communityId, authorId: userId },
    });
    postId = post.id;
    const comment = await prisma.comment.create({
      data: { body: "Comment", postId, authorId: userId },
    });
    commentId = comment.id;
  });

  afterAll(async () => {
    await prisma.rating.deleteMany({ where: { targetId: { in: [postId, commentId] } } });
    await prisma.comment.deleteMany({ where: { id: commentId } });
    await prisma.post.deleteMany({ where: { id: postId } });
    await prisma.community.deleteMany({ where: { id: communityId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, raterId] } } });
    await prisma.$disconnect();
  });

  it("recomputeForTarget sets defaults when no ratings", async () => {
    await recomputeForTarget("post", postId);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    expect(post?.cachedClarity).toBe(0);
    expect(post?.ratingCount).toBe(0);
  });

  it("recomputeForTarget averages ratings for post", async () => {
    await prisma.rating.create({
      data: {
        targetType: "post",
        targetId: postId,
        raterId,
        clarity: 2,
        evidence: 0,
        novelty: 0,
      },
    });
    await prisma.rating.create({
      data: {
        targetType: "post",
        targetId: postId,
        raterId: userId,
        clarity: 0,
        evidence: 2,
        novelty: 0,
      },
    });
    await recomputeForTarget("post", postId);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    expect(post?.cachedClarity).toBe(1);
    expect(post?.cachedEvidence).toBe(1);
    expect(post?.ratingCount).toBe(2);
    await prisma.rating.deleteMany({ where: { targetId: postId } });
  });
});
