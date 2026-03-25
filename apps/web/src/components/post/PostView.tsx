"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostDetail } from "./PostDetail";
import { CommentThread } from "../comment/CommentThread";
import { CommentComposer } from "../comment/CommentComposer";
import { RatingWidget } from "../rating/RatingWidget";
import { Button } from "../ui/Button";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/lib/useCurrentUser";
import type { Post, Comment } from "@/lib/types";

interface PostViewProps {
  post: Post;
  comments: Comment[];
}

export function PostView({ post, comments }: PostViewProps) {
  const token = getToken();
  const { user } = useCurrentUser();
  const router = useRouter();
  const [hiding, setHiding] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isAuthor = user?.id === post.authorId;
  const isHidden = !!post.deletedAt;

  const handleHide = async () => {
    if (!token || !isAuthor || hiding) return;
    setHiding(true);
    try {
      await api.post(`/posts/${post.id}/hide`, {}, token);
      router.refresh();
    } finally {
      setHiding(false);
    }
  };

  const handleRestore = async () => {
    if (!token || !isAuthor || restoring) return;
    setRestoring(true);
    try {
      await api.post(`/posts/${post.id}/restore`, {}, token);
      router.refresh();
    } finally {
      setRestoring(false);
    }
  };

  return (
    <main className="py-2 sm:py-4">
      <Link
        href={`/communities/${post.community?.slug ?? post.communityId}`}
        className="mb-4 inline-block text-sm text-link hover:underline"
      >
        ← Back to community
      </Link>
      {isHidden && (
        <div className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          This post is hidden. Only you can see it.
        </div>
      )}
      {isAuthor && (
        <div className="mb-2 flex gap-2">
          {!isHidden ? (
            <Button variant="ghost" onClick={handleHide} disabled={hiding}>
              {hiding ? "Hiding…" : "Hide post"}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleRestore} disabled={restoring}>
              {restoring ? "Restoring…" : "Restore post"}
            </Button>
          )}
        </div>
      )}
      <PostDetail post={post} />
      <section className="mt-6 rounded-lg border border-subtle bg-elevated p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-medium text-ink">Rate this post</h2>
        <RatingWidget
          targetType="post"
          targetId={post.id}
          raterId=""
          token={token}
          onSubmit={async (dimensions) => {
            if (!token) throw new Error("Not logged in");
            await api.put(
              "/ratings",
              {
                targetType: "post",
                targetId: post.id,
                ...dimensions,
              },
              token
            );
          }}
        />
      </section>
      <section className="mt-8 rounded-lg border border-subtle bg-elevated p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-medium text-ink">Comments</h2>
        <CommentComposer
          postId={post.id}
          authorId=""
          token={token}
          onSubmit={async (body) => {
            if (!token) throw new Error("Not logged in");
            await api.post(
              "/comments",
              { body, postId: post.id },
              token
            );
          }}
        />
        <CommentThread
          comments={comments}
          currentUserId={user?.id ?? null}
          token={token}
          onCommentHidden={() => router.refresh()}
        />
      </section>
    </main>
  );
}
