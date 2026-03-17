import { ListSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CommunityFeedLoading() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-1" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-4 w-28" />
      </div>
      <ListSkeleton count={4} />
    </div>
  );
}
