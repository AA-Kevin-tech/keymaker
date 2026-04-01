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
    <div className="border-b border-subtle py-3 last:border-0">
      <p className="text-[15px] leading-snug text-prose">{comment.body}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-meta">
        {comment.author && (
          <Link
            href={`/users/${comment.author.username}`}
            className="font-medium text-accentUser hover:underline"
          >
            {comment.author.username}
          </Link>
        )}
        <span>{formatDate(comment.createdAt)}</span>
        {canHide && (
          <Button
            variant="ghost"
            className="ml-auto px-2 py-1 text-xs"
            onClick={handleHide}
            disabled={hiding}
          >
            {hiding ? "Hiding…" : "Hide"}
          </Button>
        )}
      </div>
      {showScores && comment.ratingCount > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-meta">
          <span>C: {comment.cachedClarity.toFixed(1)}</span>
          <span>E: {comment.cachedEvidence.toFixed(1)}</span>
          <span>N: {comment.cachedNovelty.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
