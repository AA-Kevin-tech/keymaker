"use client";

import { useState } from "react";
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  if (!token) {
    return (
      <p className="text-gray-500 text-sm">
        <a href="/login" className="text-blue-600 hover:underline">
          Log in
        </a>{" "}
        to create a post.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post(
        "/posts",
        { title, body: body || null, communityId },
        token
      );
      setTitle("");
      setBody("");
      window.location.href = `/communities/${communitySlug}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
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
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Body (optional)
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your post..."
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create post"}
      </Button>
    </form>
  );
}
