import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
import { PostComposer } from "@/components/post/PostComposer";
import type { Community } from "@/lib/types";

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

export default async function CreatePostPage({ params }: { params: Params }) {
  const slug = params.id;
  const community = await getCommunity(slug);
  if (!community) notFound();

  return (
    <div className="py-6">
      <Link href={`/communities/${slug}`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to {community.name}
      </Link>
      <h1 className="text-xl font-semibold mb-4">New post in {community.name}</h1>
      <PostComposer
        communityId={community.id}
        communitySlug={slug}
      />
    </div>
  );
}
