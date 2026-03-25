"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { PostView } from "./PostView";
import type { Post, Comment } from "@/lib/types";

interface PostNotFoundOrHiddenProps {
  postId: string;
}

export function PostNotFoundOrHidden({ postId }: PostNotFoundOrHiddenProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.get<{ user: { id: string } }>("/auth/me", token),
      api.get<Post>(`/posts/${postId}?includeDeleted=1`, token).catch(() => null),
    ])
      .then(([meRes, postData]) => {
        if (!postData) {
          setLoading(false);
          return;
        }
        setPost(postData);
        setIsAuthor(meRes.user.id === postData.authorId);
        if (meRes.user.id === postData.authorId) {
          return api
            .get<{ comments: Comment[] }>(`/comments/by-post/${postId}`, token)
            .then((r) => setComments(r.comments));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <main className="py-6">
        <p className="text-meta">Loading…</p>
      </main>
    );
  }

  if (post && isAuthor) {
    return <PostView post={post} comments={comments} />;
  }

  return (
    <main className="py-6">
      <p className="text-prose">Post not found.</p>
      <Link href="/" className="mt-2 inline-block text-link hover:underline">
        ← Back home
      </Link>
    </main>
  );
}
