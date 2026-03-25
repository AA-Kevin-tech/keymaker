import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Community } from "@/lib/types";

interface CommunityCardProps {
  community: Pick<Community, "id" | "name" | "slug">;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link href={`/communities/${community.slug}`}>
      <Card className="cursor-pointer p-4 shadow-none transition hover:bg-canvas">
        <h3 className="font-medium text-gray-900">{community.name}</h3>
        <p className="text-sm text-meta">/{community.slug}</p>
      </Card>
    </Link>
  );
}
