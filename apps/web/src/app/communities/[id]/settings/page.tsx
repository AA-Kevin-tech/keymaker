import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { Community } from "@/lib/types";
import { CommunitySettingsForm } from "./CommunitySettingsForm";

export const dynamic = "force-dynamic";

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

export default async function CommunitySettingsPage({ params }: { params: Params }) {
  const slug = params.id;
  const community = await getCommunity(slug);
  if (!community) notFound();

  return (
    <main className="py-6 max-w-lg">
      <Link
        href={`/communities/${slug}`}
        className="text-blue-600 hover:underline text-sm font-medium mb-4 inline-block"
      >
        ← Back to {community.name}
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Community settings</h1>
      <p className="text-gray-500 text-sm mb-6">
        Weights and time decay affect how posts are ranked in the feed. See README for the formula.
      </p>
      <CommunitySettingsForm community={community} slug={slug} />
    </main>
  );
}
