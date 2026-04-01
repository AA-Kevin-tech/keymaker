"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface PostComposerProps {
  communityId: string;
  communitySlug: string;
}

export function PostComposer({
  communityId,
  communitySlug,
}: PostComposerProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  if (!token) {
    return (
      <p className="text-sm text-meta">
        <a href="/login" className="text-link hover:underline">
          Log in
        </a>{" "}
        to create a post.
      </p>
    );
  }

  const bearerToken = token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post(
        "/posts",
        { title, body: body || null, communityId },
        bearerToken
      );
      setTitle("");
      setBody("");
      router.replace(`/communities/${communitySlug}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-ink">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={300}
          placeholder="Post title"
        />
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium text-ink">
          Body (optional)
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your post..."
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create post"}
      </Button>
    </form>
  );
}
