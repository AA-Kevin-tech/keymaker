"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

function CheckEmailInner() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/resend-verification", { email });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto py-8">
      <h1 className="mb-4 text-xl font-semibold text-ink">Check your email</h1>
      <Card className="space-y-4 p-6">
        <p className="text-sm text-prose">
          We sent a verification link to{" "}
          <strong className="text-ink">
            {initialEmail || email || "your address"}
          </strong>
          . Open it to activate your account, then log in.
        </p>
        {sent && (
          <p className="text-sm text-emerald-400">
            If an account exists for that email and is not verified, we sent a new link.
          </p>
        )}
        <form onSubmit={handleResend} className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Resend verification email"}
          </Button>
        </form>
        <p className="text-center text-sm">
          <Link href="/login" className="text-link hover:underline">
            Back to log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-sm mx-auto py-8">
          <p className="text-meta">Loading…</p>
        </div>
      }
    >
      <CheckEmailInner />
    </Suspense>
  );
}
