import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/lib/types";

interface CommentItemProps {
  comment: Comment;
  showScores?: boolean;
}

export function CommentItem({ comment, showScores = true }: CommentItemProps) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-gray-800">{comment.body}</p>
      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
        {comment.author && (
          <Link
            href={`/users/${comment.author.username}`}
            className="text-blue-600 hover:underline"
          >
            {comment.author.username}
          </Link>
        )}
        <span>{formatDate(comment.createdAt)}</span>
      </div>
      {showScores && comment.ratingCount > 0 && (
        <div className="flex gap-2 mt-1 text-xs text-gray-500">
          <span>C: {comment.cachedClarity.toFixed(1)}</span>
          <span>E: {comment.cachedEvidence.toFixed(1)}</span>
          <span>K: {comment.cachedKindness.toFixed(1)}</span>
          <span>N: {comment.cachedNovelty.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
