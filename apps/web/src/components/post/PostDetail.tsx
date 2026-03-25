import Link from "next/link";
import { ScoreBadges } from "./ScoreBadges";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article className="mb-6 rounded-md border border-subtle bg-elevated p-4 sm:p-5">
      <h1 className="text-2xl font-semibold text-gray-900">{post.title}</h1>
      {post.body && (
        <p className="mt-3 whitespace-pre-wrap text-gray-800">{post.body}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-meta">
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
          <Link
            href={`/users/${post.author.username}`}
            className="hover:text-link hover:underline"
          >
            {post.author.username}
          </Link>
        )}
        <span className="text-gray-400" aria-hidden>
          ·
        </span>
        <span>{formatDate(post.createdAt)}</span>
      </div>
      <ScoreBadges post={post} />
    </article>
  );
}
