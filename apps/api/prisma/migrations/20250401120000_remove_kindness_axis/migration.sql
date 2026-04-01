-- Drop Kindness axis from ratings, cached aggregates, reputation, and community weights.
ALTER TABLE "ratings" DROP COLUMN "kindness";
ALTER TABLE "posts" DROP COLUMN "cachedKindness";
ALTER TABLE "comments" DROP COLUMN "cachedKindness";
ALTER TABLE "users" DROP COLUMN "reputationKindness";
ALTER TABLE "communities" DROP COLUMN "weightKindness";
