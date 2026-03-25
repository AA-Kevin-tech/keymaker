import Link from "next/link";
import { ScoreBadges } from "./ScoreBadges";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article className="mb-6 rounded-lg border border-subtle bg-elevated p-4 sm:p-5">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {post.title}
      </h1>
      {post.body && (
        <p className="mt-3 whitespace-pre-wrap text-prose">{post.body}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-meta">
        {post.author && (
          <>
            <Link
              href={`/users/${post.author.username}`}
              className="font-medium text-accentUser hover:underline"
            >
              {post.author.username}
            </Link>
            {post.community && <span>to</span>}
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
      </div>
      <ScoreBadges post={post} />
    </article>
  );
}
