import Link from "next/link";
import { PostAxisRail } from "./PostAxisRail";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group flex flex-col gap-3 p-3 pl-2 transition-colors hover:bg-rowHover sm:flex-row sm:items-stretch sm:gap-4 sm:py-4">
      <PostAxisRail post={post} />
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-snug text-ink">
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
          {post.author && (
            <>
              <Link
                href={`/users/${post.author.username}`}
                className="font-medium text-accentUser hover:underline"
              >
                {post.author.username}
              </Link>
              {post.community && <span className="text-meta">to</span>}
            </>
          )}
          {post.community && (
            <Link
              href={`/communities/${post.community.slug}`}
              className="font-medium text-accentCommunity hover:underline"
            >
              /{post.community.slug}
            </Link>
          )}
          {(post.author || post.community) && (
            <span className="text-meta/50" aria-hidden>
              ·
            </span>
          )}
          <span>{formatDate(post.createdAt)}</span>
          {post.ratingCount > 0 && (
            <>
              <span className="text-meta/50" aria-hidden>
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
