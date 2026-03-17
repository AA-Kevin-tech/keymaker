import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../../db/prisma.js";
import { recomputeForUser } from "./reputation.service.js";

describe("reputation.service", () => {
  let userId: string;
  let communityId: string;
  let postId: string;
  let raterId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: `rep-user-${Date.now()}`,
        passwordHash: "hash",
      },
    });
    userId = user.id;
    const community = await prisma.community.create({
      data: { name: "Rep Test", slug: `rep-${Date.now()}` },
    });
    communityId = community.id;
    const post = await prisma.post.create({
      data: { title: "P", body: "B", communityId, authorId: userId },
    });
    postId = post.id;
    const rater = await prisma.user.create({
      data: { username: `rater-rep-${Date.now()}`, passwordHash: "h" },
    });
    raterId = rater.id;
  });

  afterAll(async () => {
    await prisma.rating.deleteMany({ where: { targetId: postId } });
    await prisma.post.deleteMany({ where: { id: postId } });
    await prisma.community.deleteMany({ where: { id: communityId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, raterId] } } });
    await prisma.$disconnect();
  });

  it("recomputeForUser sets zero when no ratings", async () => {
    await recomputeForUser(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.reputationClarity).toBe(0);
    expect(user?.reputationEvidence).toBe(0);
  });

  it("recomputeForUser updates from ratings on author content", async () => {
    await prisma.rating.create({
      data: {
        targetType: "post",
        targetId: postId,
        raterId,
        clarity: 2,
        evidence: 1,
        kindness: 1,
        novelty: 0,
      },
    });
    await recomputeForUser(userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.reputationClarity).toBe(2);
    expect(user?.reputationEvidence).toBe(1);
    expect(user?.reputationKindness).toBe(1);
    expect(user?.reputationNovelty).toBe(0);
  });
});
