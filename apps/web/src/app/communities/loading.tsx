import { ListSkeleton } from "@/components/ui/Skeleton";

export default function CommunitiesLoading() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-subtle" />
        <div className="h-5 w-32 animate-pulse rounded bg-subtle" />
      </div>
      <ListSkeleton count={5} />
    </div>
  );
}
