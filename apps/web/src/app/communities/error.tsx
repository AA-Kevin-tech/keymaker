"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CommunitiesError({
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
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Could not load communities</h2>
      <p className="text-gray-600 text-sm mb-6">{error.message || "Please check your connection and try again."}</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
