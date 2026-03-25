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

  const isDev = process.env.NODE_ENV === "development";
  const devDetail = isDev && error.message ? error.message : null;
  const prodHint =
    "This usually means the web app could not reach the API (wrong or missing API_URL / NEXT_PUBLIC_API_URL, API sleeping, or network). On Railway, set both to your API service URL ending in /api, rebuild the web service, and check API logs. Error details are hidden in production; use server logs for the digest below.";

  return (
    <div className="py-12 px-4 text-center max-w-lg mx-auto">
      <h2 className="mb-2 text-lg font-semibold text-ink">
        Could not load communities
      </h2>
      <p
        className={`text-sm text-meta text-left ${error.digest ? "mb-4" : "mb-6"}`}
      >
        {devDetail ?? prodHint}
      </p>
      {error.digest ? (
        <p className="mb-6 text-xs text-meta font-mono break-all text-left">
          Digest: {error.digest}
        </p>
      ) : null}
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
