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
  const [deleting, setDeleting] = useState(false);
  const isAuthor = user?.id === post.authorId;
  const communityPath = `/communities/${post.community?.slug ?? post.communityId}`;

  const handleDelete = async () => {
    if (!token || !isAuthor || deleting) return;
    const ok = window.confirm(
      "Remove this post? It will be hidden from the community. You can restore it later unless a moderator removed it."
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`, token);
      router.push(communityPath);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="py-2 sm:py-4">
      <Link
        href={communityPath}
        className="mb-4 inline-block text-sm text-link hover:underline"
      >
        ← Back to community
      </Link>
      {isAuthor && (
        <div className="mb-2 flex gap-2">
          <Button variant="ghost" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Removing…" : "Remove post"}
          </Button>
        </div>
      )}
      <PostDetail post={post} />
      <section className="mt-6 rounded-lg border border-subtle bg-elevated p-4 sm:p-5">
        <h2 className="mb-3 text-lg font-medium text-ink">Rate this post</h2>
        <RatingWidget
          targetType="post"
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
