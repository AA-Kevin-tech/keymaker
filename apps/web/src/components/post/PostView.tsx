"use client";

import Link from "next/link";
import { PostDetail } from "./PostDetail";
import { CommentThread } from "../comment/CommentThread";
import { CommentComposer } from "../comment/CommentComposer";
import { RatingWidget } from "../rating/RatingWidget";
import { getToken, getUserId } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Post, Comment } from "@/lib/types";

interface PostViewProps {
  post: Post;
  comments: Comment[];
}

export function PostView({ post, comments }: PostViewProps) {
  const token = getToken();
  const raterId = getUserId();

  return (
    <main className="py-6">
      <Link href={`/communities/${post.community?.slug ?? post.communityId}`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to community
      </Link>
      <PostDetail post={post} />
      <section className="mt-6">
        <h2 className="text-lg font-medium mb-2">Rate this post</h2>
        <RatingWidget
          targetType="post"
          targetId={post.id}
          raterId={raterId ?? ""}
          token={token}
          onSubmit={async (dimensions) => {
            if (!token || !raterId) throw new Error("Not logged in");
            await api.put(
              "/ratings",
              {
                targetType: "post",
                targetId: post.id,
                raterId,
                ...dimensions,
              },
              token
            );
          }}
        />
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-medium mb-2">Comments</h2>
        <CommentComposer
          postId={post.id}
          authorId={raterId ?? ""}
          token={token}
          onSubmit={async (body) => {
            if (!token || !raterId) throw new Error("Not logged in");
            await api.post(
              "/comments",
              { body, postId: post.id, authorId: raterId },
              token
            );
          }}
        />
        <CommentThread comments={comments} />
      </section>
    </main>
  );
}
