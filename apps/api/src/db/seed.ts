/**
 * Seed script: users, communities, posts, comments, and a few ratings.
 * Run: pnpm run seed (from repo root or apps/api)
 */
import { prisma } from "./prisma.js";
import * as bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { username: "alice" },
    update: {},
    create: {
      username: "alice",
      passwordHash: hash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { username: "bob" },
    update: {},
    create: {
      username: "bob",
      passwordHash: hash,
    },
  });

  const general = await prisma.community.upsert({
    where: { slug: "general" },
    update: {},
    create: {
      name: "General",
      slug: "general",
      weightClarity: 1,
      weightEvidence: 1,
      weightKindness: 1,
      weightNovelty: 1,
      decayHalfLifeSeconds: 86400,
    },
  });

  const post1 = await prisma.post.upsert({
    where: { id: "seed-post-1" },
    update: {},
    create: {
      id: "seed-post-1",
      title: "Welcome to Keymaker",
      body: "This is a place for four-axis evaluation: clarity, evidence, kindness, novelty.",
      communityId: general.id,
      authorId: alice.id,
    },
  });

  const comment1 = await prisma.comment.upsert({
    where: { id: "seed-comment-1" },
    update: {},
    create: {
      id: "seed-comment-1",
      body: "Looking forward to thoughtful discussions.",
      postId: post1.id,
      authorId: bob.id,
    },
  });

  await prisma.rating.upsert({
    where: {
      targetType_targetId_raterId: {
        targetType: "post",
        targetId: post1.id,
        raterId: bob.id,
      },
    },
    update: { clarity: 1, evidence: 1, kindness: 2, novelty: 0 },
    create: {
      targetType: "post",
      targetId: post1.id,
      raterId: bob.id,
      clarity: 1,
      evidence: 1,
      kindness: 2,
      novelty: 0,
    },
  });

  await prisma.rating.upsert({
    where: {
      targetType_targetId_raterId: {
        targetType: "comment",
        targetId: comment1.id,
        raterId: alice.id,
      },
    },
    update: { clarity: 2, evidence: 0, kindness: 2, novelty: 0 },
    create: {
      targetType: "comment",
      targetId: comment1.id,
      raterId: alice.id,
      clarity: 2,
      evidence: 0,
      kindness: 2,
      novelty: 0,
    },
  });

  console.log("Seed complete: users, community, post, comment, ratings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
