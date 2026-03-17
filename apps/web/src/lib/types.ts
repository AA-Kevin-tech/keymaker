export interface User {
  id: string;
  username: string;
  createdAt: string;
  reputationClarity: number;
  reputationEvidence: number;
  reputationKindness: number;
  reputationNovelty: number;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  weightClarity?: number;
  weightEvidence?: number;
  weightKindness?: number;
  weightNovelty?: number;
  decayHalfLifeSeconds?: number;
}

export interface Post {
  id: string;
  title: string;
  body: string | null;
  communityId: string;
  community?: { id: string; name: string; slug: string };
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
}

export interface Comment {
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
}

export interface RatingDimensions {
  clarity: number;
  evidence: number;
  kindness: number;
  novelty: number;
}
