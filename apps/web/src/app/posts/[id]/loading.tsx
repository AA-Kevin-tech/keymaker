import { Skeleton } from "@/components/ui/Skeleton";

export default function PostLoading() {
  return (
    <div className="py-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg mb-6" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}
