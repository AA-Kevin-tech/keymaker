"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-12 px-4 text-center">
      <h2 className="mb-2 text-lg font-semibold text-ink">Could not load post</h2>
      <p className="mb-6 text-sm text-meta">
        {error.message || "The post may not exist or the server is unavailable."}
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>Try again</Button>
        <Link href="/communities">
          <Button variant="secondary">Browse communities</Button>
        </Link>
      </div>
    </div>
  );
}
