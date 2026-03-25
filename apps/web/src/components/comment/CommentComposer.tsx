"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface CommentComposerProps {
  postId: string;
  authorId: string;
  token: string | null;
  onSubmit: (body: string) => Promise<void>;
}

export function CommentComposer({
  postId,
  authorId,
  token,
  onSubmit,
}: CommentComposerProps) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="py-2 text-sm text-meta">
        <a href="/login" className="text-link hover:underline">
          Log in
        </a>{" "}
        to comment.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(body);
      setBody("");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        placeholder="Write a comment..."
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? "Posting…" : "Post comment"}
      </Button>
    </form>
  );
}
