import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
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
    <main className="py-6">
      <CommunityHeader community={community} />
      <Link
        href={`/communities/${slug}/create`}
        className="inline-block mb-4 text-blue-600 hover:underline font-medium text-sm"
      >
        New post
      </Link>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts yet.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
