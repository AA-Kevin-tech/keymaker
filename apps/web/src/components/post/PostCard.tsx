import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ScoreBadges } from "./ScoreBadges";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`}>
      <Card className="p-4 hover:border-gray-300 transition cursor-pointer">
        <h3 className="font-medium text-gray-900">{post.title}</h3>
        {post.body && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.body}</p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          {post.author && (
            <span>
              by <strong>{post.author.username}</strong>
            </span>
          )}
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <ScoreBadges post={post} />
      </Card>
    </Link>
  );
}
