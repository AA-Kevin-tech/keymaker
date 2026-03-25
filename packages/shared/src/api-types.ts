/**
 * Request/response shapes for Keymaker REST API.
 */

import type { RatingDimensions } from "./score-types.js";

export interface UserResponse {
  id: string;
  username: string;
  createdAt: string;
  reputationClarity: number;
  reputationEvidence: number;
  reputationKindness: number;
  reputationNovelty: number;
}

export interface CommunityResponse {
  id: string;
  name: string;
  slug: string;
  weightClarity: number;
  weightEvidence: number;
  weightKindness: number;
  weightNovelty: number;
  decayHalfLifeSeconds: number;
  createdAt?: string;
}

export interface PostResponse {
  id: string;
  title: string;
  body: string | null;
  communityId: string;
  authorId: string;
  author?: { id: string; username: string };
  cachedClarity: number;
  cachedEvidence: number;
  cachedKindness: number;
  cachedNovelty: number;
  cachedScore: number;
  ratingCount: number;
  createdAt: string;
  deletedAt?: string | null;
  /** Raw enum when soft-deleted; null when active or legacy rows. */
  deletionKind?: "author_deleted" | "moderator_removed" | null;
  /** Derived: active | author_deleted | moderator_removed | legacy_deleted */
  deletionState?: string;
}

export interface CommentResponse {
  id: string;
  body: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  author?: { id: string; username: string };
  cachedClarity: number;
  cachedEvidence: number;
  cachedKindness: number;
  cachedNovelty: number;
  cachedScore: number;
  ratingCount: number;
  createdAt: string;
  deletedAt?: string | null;
  deletionKind?: "author_deleted" | "moderator_removed" | null;
  deletionState?: string;
}

export interface RatingResponse {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  raterId: string;
  clarity: number;
  evidence: number;
  kindness: number;
  novelty: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertRatingBody {
  targetType: "post" | "comment";
  targetId: string;
  raterId: string;
  clarity: number;
  evidence: number;
  kindness: number;
  novelty: number;
}

export interface FeedResponse {
  posts: PostResponse[];
}

export interface ModerationActionResponse {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  moderatorId: string;
  communityId: string | null;
  reason: string | null;
  createdAt: string;
}
