import { describe, it, expect } from "vitest";
import { computePostScore } from "./ranking.service.js";

describe("ranking.service", () => {
  const community = {
    weightClarity: 1,
    weightEvidence: 1,
    weightNovelty: 1,
    decayHalfLifeSeconds: 86400,
  };

  it("computePostScore: higher content score ranks higher", () => {
    const now = new Date();
    const base = {
      cachedClarity: 0,
      cachedEvidence: 0,
      cachedNovelty: 0,
      ratingCount: 5,
      createdAt: new Date(now.getTime() - 1000),
    };
    const low = computePostScore({ ...base }, community, now);
    const high = computePostScore(
      { ...base, cachedClarity: 2, cachedEvidence: 2 },
      community,
      now
    );
    expect(high).toBeGreaterThan(low);
  });

  it("computePostScore: newer post has higher decay than older", () => {
    const now = new Date();
    const sameContent = {
      cachedClarity: 1,
      cachedEvidence: 1,
      cachedNovelty: 1,
      ratingCount: 5,
    };
    const newer = computePostScore(
      { ...sameContent, createdAt: new Date(now.getTime() - 1000) },
      community,
      now
    );
    const older = computePostScore(
      { ...sameContent, createdAt: new Date(now.getTime() - 86400 * 1000) },
      community,
      now
    );
    expect(newer).toBeGreaterThan(older);
  });

  it("computePostScore: low rating count is dampened", () => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - 1000);
    const content = {
      cachedClarity: 2,
      cachedEvidence: 2,
      cachedNovelty: 2,
      createdAt,
    };
    const withFewRatings = computePostScore(
      { ...content, ratingCount: 1 },
      community,
      now
    );
    const withManyRatings = computePostScore(
      { ...content, ratingCount: 10 },
      community,
      now
    );
    expect(withManyRatings).toBeGreaterThan(withFewRatings);
  });

  it("computePostScore: respects community weights", () => {
    const now = new Date();
    const post = {
      cachedClarity: 2,
      cachedEvidence: 0,
      cachedNovelty: 0,
      ratingCount: 5,
      createdAt: new Date(now.getTime() - 1000),
    };
    const wClarity = computePostScore(post, { ...community, weightClarity: 2 }, now);
    const wDefault = computePostScore(post, community, now);
    expect(wClarity).toBeGreaterThan(wDefault);
  });
});
