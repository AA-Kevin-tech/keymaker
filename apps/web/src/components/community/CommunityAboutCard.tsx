import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Community } from "@/lib/types";

export function CommunityAboutCard({ community }: { community: Community }) {
  return (
    <Card className="p-4 shadow-none">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-meta">
        About community
      </h2>
      <p className="mt-2 font-medium text-gray-900">{community.name}</p>
      <p className="text-sm text-meta">/{community.slug}</p>
      <div className="mt-4 flex flex-col gap-2 border-t border-subtle pt-4 text-sm">
        <Link
          href={`/communities/${community.slug}/create`}
          className="font-medium text-link hover:underline"
        >
          New post
        </Link>
        <Link
          href={`/communities/${community.slug}/settings`}
          className="text-meta hover:text-gray-900 hover:underline"
        >
          Community settings
        </Link>
      </div>
    </Card>
  );
}
