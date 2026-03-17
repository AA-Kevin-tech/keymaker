import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "../ui/Button";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

interface CommentItemProps {
  comment: Comment;
  showScores?: boolean;
  currentUserId?: string | null;
  token?: string | null;
  onHide?: () => void;
}

export function CommentItem({
  comment,
  showScores = true,
  currentUserId = null,
  token = null,
  onHide,
}: CommentItemProps) {
  const [hiding, setHiding] = useState(false);
  const isAuthor = currentUserId === comment.authorId;
  const canHide = isAuthor && token && onHide;

  const handleHide = async () => {
    if (!token || !onHide || hiding) return;
    setHiding(true);
    try {
      await api.post(`/comments/${comment.id}/hide`, {}, token);
      onHide();
    } finally {
      setHiding(false);
    }
  };

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-gray-800">{comment.body}</p>
      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 flex-wrap">
        {comment.author && (
          <Link
            href={`/users/${comment.author.username}`}
            className="text-blue-600 hover:underline"
          >
            {comment.author.username}
          </Link>
        )}
        <span>{formatDate(comment.createdAt)}</span>
        {canHide && (
          <Button
            variant="ghost"
            className="ml-auto text-xs py-1 px-2"
            onClick={handleHide}
            disabled={hiding}
          >
            {hiding ? "Hiding…" : "Hide"}
          </Button>
        )}
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
