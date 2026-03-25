import type { Community } from "@/lib/types";

interface CommunityHeaderProps {
  community: Community;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-semibold text-gray-900">{community.name}</h1>
      <p className="text-sm text-meta">/{community.slug}</p>
    </header>
  );
}
