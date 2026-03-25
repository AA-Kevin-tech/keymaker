"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = getToken();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post(
        "/communities",
        { name: name.trim(), slug: slug.trim().toLowerCase().replace(/\s+/g, "-") },
        token ?? undefined
      );
      router.push("/communities");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create community");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="py-8">
        <p className="text-meta">
          <Link href="/login" className="text-link hover:underline">
            Log in
          </Link>{" "}
          to create a community.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="mb-4 text-xl font-semibold text-ink">Create community</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="General"
            />
          </div>
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-ink">
              Slug (URL-friendly)
            </label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="general"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create community"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
