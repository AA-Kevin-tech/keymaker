import Link from "next/link";
import { ScoreBadges } from "./ScoreBadges";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
  return (
    <article className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">{post.title}</h1>
      {post.body && <p className="mt-2 text-gray-700 whitespace-pre-wrap">{post.body}</p>}
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
        {post.author && (
          <Link
            href={`/users/${post.author.username}`}
            className="text-blue-600 hover:underline"
          >
            {post.author.username}
          </Link>
        )}
        <span>{formatDate(post.createdAt)}</span>
      </div>
      <ScoreBadges post={post} />
    </article>
  );
}
