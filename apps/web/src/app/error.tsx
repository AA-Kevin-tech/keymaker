"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({
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
    <div className="min-h-[40vh] flex flex-col items-center justify-center px-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 text-sm text-center max-w-md mb-6">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
