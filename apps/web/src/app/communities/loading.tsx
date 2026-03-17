import { ListSkeleton } from "@/components/ui/Skeleton";

export default function CommunitiesLoading() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <ListSkeleton count={5} />
    </div>
  );
}
