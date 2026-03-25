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
    <main className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
      <div className="min-w-0">
        <CommunityHeader community={community} />
        <Link
          href={`/communities/${slug}/create`}
          className="mb-4 inline-flex items-center rounded-full border border-subtle bg-elevated px-4 py-1.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-canvas"
        >
          New post
        </Link>
        {posts.length === 0 ? (
          <p className="text-meta">No posts yet.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-subtle bg-elevated divide-y divide-subtle">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
      <aside className="min-w-0 lg:sticky lg:top-14 lg:self-start">
        <CommunityAboutCard community={community} />
      </aside>
    </main>
  );
}
