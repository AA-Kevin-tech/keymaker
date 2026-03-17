import { Skeleton } from "@/components/ui/Skeleton";

export default function UserProfileLoading() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-2 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
