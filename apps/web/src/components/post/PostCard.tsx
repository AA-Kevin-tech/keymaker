import Link from "next/link";
import { PostAxisRail } from "./PostAxisRail";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group flex flex-col gap-3 p-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-stretch sm:gap-4 sm:p-3 sm:pl-2">
      <PostAxisRail post={post} />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900">
          <Link
            href={`/posts/${post.id}`}
            className="hover:text-link hover:underline"
          >
            {post.title}
          </Link>
        </h3>
        {post.body && (
          <p className="mt-1 line-clamp-2 text-sm text-meta">{post.body}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-meta">
          {post.community && (
            <>
              <Link
                href={`/communities/${post.community.slug}`}
                className="font-medium text-gray-700 hover:text-link hover:underline"
              >
                /{post.community.slug}
              </Link>
              <span className="text-gray-400" aria-hidden>
                ·
              </span>
            </>
          )}
          {post.author && (
            <span>
              <span className="text-gray-500">by </span>
              <span className="font-medium text-gray-700">{post.author.username}</span>
            </span>
          )}
          <span className="text-gray-400" aria-hidden>
            ·
          </span>
          <span>{formatDate(post.createdAt)}</span>
          {post.ratingCount > 0 && (
            <>
              <span className="text-gray-400" aria-hidden>
                ·
              </span>
              <span>{post.ratingCount} ratings</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
