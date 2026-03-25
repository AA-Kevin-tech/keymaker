import { api, ApiError } from "@/lib/api";
import type { Community, Post } from "@/lib/types";

/**
 * Server-only helpers for community pages. Only maps API 404 to null/[]; other failures
 * propagate so `communities/error.tsx` can surface misconfiguration or API outages.
 */
export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  try {
    return await api.get<Community>(`/communities/${slug}`);
  } catch (e) {
    if (e instanceof ApiError && e.statusCode === 404) return null;
    throw e;
  }
}

export async function getCommunityFeedPosts(slug: string): Promise<Post[]> {
  try {
    const res = await api.get<{ posts: Post[] }>(`/communities/${slug}/feed`);
    return res.posts;
  } catch (e) {
    if (e instanceof ApiError && e.statusCode === 404) return [];
    throw e;
  }
}
