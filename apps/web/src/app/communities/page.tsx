import Link from "next/link";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
import { CommunityCard } from "@/components/community/CommunityCard";
import { Card } from "@/components/ui/Card";

interface CommunityListItem {
  id: string;
  name: string;
  slug: string;
}

async function getCommunities(): Promise<CommunityListItem[]> {
  const res = await api.get<{ communities: CommunityListItem[] }>("/communities");
  return res.communities;
}

export default async function CommunitiesPage() {
  const communities = await getCommunities();

  return (
    <main className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Communities</h1>
        <Link
          href="/communities/create"
          className="text-blue-600 hover:underline font-medium text-sm"
        >
          Create community
        </Link>
      </div>
      {communities.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          <p>No communities yet.</p>
          <Link href="/communities/create" className="text-blue-600 hover:underline mt-2 inline-block">
            Create the first one
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3">
          {communities.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      )}
    </main>
  );
}
