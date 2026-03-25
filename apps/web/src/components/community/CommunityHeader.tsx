import type { Community } from "@/lib/types";

interface CommunityHeaderProps {
  community: Community;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  return (
    <header className="mb-2">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {community.name}
      </h1>
      <p className="text-sm text-accentCommunity">/{community.slug}</p>
    </header>
  );
}
