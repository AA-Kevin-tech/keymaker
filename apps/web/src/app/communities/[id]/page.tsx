import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
import { CommunityAboutCard } from "@/components/community/CommunityAboutCard";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { PostCard } from "@/components/post/PostCard";
import type { Community, Post } from "@/lib/types";

interface Params {
  id: string;
}

async function getCommunity(slug: string): Promise<Community | null> {
  try {
    return await api.get<Community>(`/communities/${slug}`);
  } catch {
    return null;
  }
}

async function getFeed(slug: string): Promise<Post[]> {
  try {
    const res = await api.get<{ posts: Post[] }>(`/communities/${slug}/feed`);
    return res.posts;
  } catch {
    return [];
  }
}

export default async function CommunityFeedPage({ params }: { params: Params }) {
  const slug = params.id;
  const [community, posts] = await Promise.all([
    getCommunity(slug),
    getFeed(slug),
  ]);

  if (!community) notFound();

  return (
    <main className="space-y-6">
      <CommunityHeader community={community} />
      <CommunityAboutCard community={community} />
      <Link
        href={`/communities/${slug}/create`}
        className="inline-flex items-center rounded-lg border border-subtle bg-control px-4 py-2 text-sm font-medium text-ink transition hover:bg-subtle"
      >
        New post
      </Link>
      {posts.length === 0 ? (
        <p className="text-meta">No posts yet.</p>
      ) : (
        <div className="divide-y divide-subtle rounded-lg border border-subtle bg-elevated">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
