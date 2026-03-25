"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Missing verification link. Check your email for the full link.");
      return;
    }
    api
      .post<{ message: string }>("/auth/verify-email", { token })
      .then((res) => {
        setStatus("ok");
        setMessage(res.message);
      })
      .catch((e) => {
        setStatus("err");
        setMessage(e instanceof Error ? e.message : "Verification failed");
      });
  }, [token]);

  return (
    <div className="max-w-sm mx-auto py-8">
      <h1 className="text-xl font-semibold mb-4">Email verification</h1>
      <Card className="p-6">
        {status === "loading" && <p className="text-gray-600">Verifying…</p>}
        {status === "ok" && (
          <div className="space-y-4">
            <p className="text-gray-800">{message}</p>
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
          </div>
        )}
        {status === "err" && (
          <div className="space-y-4">
            <p className="text-red-600 text-sm">{message}</p>
            <p className="text-sm text-gray-600">
              You can request a new link from the registration confirmation page.
            </p>
            <Link href="/register/check-email" className="text-blue-600 hover:underline">
              Resend verification email
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-sm mx-auto py-8">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
