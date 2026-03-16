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
      <Link
        href={`/communities/${community.slug}/create`}
        className="mt-2 inline-block text-blue-600 hover:underline text-sm font-medium"
      >
        New post
      </Link>
    </div>
  );
}
