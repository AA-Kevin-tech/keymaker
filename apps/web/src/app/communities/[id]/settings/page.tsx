import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/server-community";
import { CommunitySettingsForm } from "./CommunitySettingsForm";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export default async function CommunitySettingsPage({ params }: { params: Params }) {
  const slug = params.id;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  return (
    <main className="py-6 max-w-lg">
      <Link
        href={`/communities/${slug}`}
        className="mb-4 inline-block text-sm font-medium text-link hover:underline"
      >
        ← Back to {community.name}
      </Link>
      <h1 className="mb-2 text-xl font-semibold text-ink">Community settings</h1>
      <p className="mb-6 text-sm text-meta">
        Weights and time decay affect how posts are ranked in the feed. See README for the formula.
      </p>
      <CommunitySettingsForm community={community} slug={slug} />
    </main>
  );
}
