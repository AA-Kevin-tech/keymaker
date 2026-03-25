import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { PostComposer } from "@/components/post/PostComposer";
import { getCommunityBySlug } from "@/lib/server-community";

interface Params {
  id: string;
}

export default async function CreatePostPage({ params }: { params: Params }) {
  const slug = params.id;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  return (
    <div className="py-6">
      <Link
        href={`/communities/${slug}`}
        className="mb-4 inline-block text-sm font-medium text-link hover:underline"
      >
        ← Back to {community.name}
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-ink">
        New post in {community.name}
      </h1>
      <PostComposer
        communityId={community.id}
        communitySlug={slug}
      />
    </div>
  );
}
