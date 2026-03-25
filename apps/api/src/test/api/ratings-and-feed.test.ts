import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../db/prisma.js";

describe("API ratings and feed", () => {
  let token: string;
  let userId: string;
  let communityId: string;
  let postId: string;
  const slug = `feed-${Date.now()}`;

  beforeAll(async () => {
    const u = `user-${Date.now()}`;
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ username: u, email: `${u}@example.com`, password: "password123" });
    token = reg.body.token;
    userId = reg.body.user.id;

    const comm = await request(app)
      .post("/api/communities")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Feed Community", slug });
    communityId = comm.body.id;

    const post = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Post", body: "Body", communityId });
    postId = post.body.id;
  });

  afterAll(async () => {
    await prisma.rating.deleteMany({ where: { targetId: postId } });
    await prisma.comment.deleteMany({ where: { postId } });
    await prisma.post.deleteMany({ where: { id: postId } });
    await prisma.community.deleteMany({ where: { id: communityId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("PUT /api/ratings upserts and returns rating", async () => {
    const res = await request(app)
      .put("/api/ratings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        targetType: "post",
        targetId: postId,
        clarity: 1,
        evidence: 1,
        kindness: 2,
        novelty: 0,
      })
      .expect(200);
    expect(res.body.raterId).toBe(userId);
    expect(res.body.clarity).toBe(1);
  });

  it("GET /api/communities/:slug/feed returns ranked posts", async () => {
    const res = await request(app)
      .get(`/api/communities/${slug}/feed`)
      .expect(200);
    expect(res.body.posts).toBeInstanceOf(Array);
    const found = res.body.posts.find((p: { id: string }) => p.id === postId);
    expect(found).toBeDefined();
    expect(found.cachedClarity).toBe(1);
    expect(found.ratingCount).toBe(1);
  });

  it("GET /api/users/:username returns user with reputation", async () => {
    const userRes = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    const username = userRes.body.user.username;
    const res = await request(app).get(`/api/users/${username}`).expect(200);
    expect(res.body.reputationClarity).toBe(1);
    expect(res.body.reputationEvidence).toBe(1);
    expect(res.body.reputationKindness).toBe(2);
  });
});
