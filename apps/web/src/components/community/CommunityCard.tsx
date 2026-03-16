import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { Community } from "@/lib/types";

interface CommunityCardProps {
  community: Pick<Community, "id" | "name" | "slug">;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link href={`/communities/${community.slug}`}>
      <Card className="p-4 hover:border-gray-300 transition cursor-pointer">
        <h3 className="font-medium text-gray-900">{community.name}</h3>
        <p className="text-sm text-gray-500">/{community.slug}</p>
      </Card>
    </Link>
  );
}
