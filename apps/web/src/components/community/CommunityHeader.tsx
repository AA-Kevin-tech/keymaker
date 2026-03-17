import type { Community } from "@/lib/types";
import Link from "next/link";

interface CommunityHeaderProps {
  community: Community;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">{community.name}</h1>
      <p className="text-gray-500 text-sm">/{community.slug}</p>
      <div className="mt-2 flex gap-4">
        <Link
          href={`/communities/${community.slug}/create`}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          New post
        </Link>
        <Link
          href={`/communities/${community.slug}/settings`}
          className="text-gray-600 hover:underline text-sm font-medium"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
