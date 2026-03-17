import { CommentItem } from "./CommentItem";
import type { Comment } from "@/lib/types";

interface CommentThreadProps {
  comments: Comment[];
  currentUserId?: string | null;
  token?: string | null;
  onCommentHidden?: () => void;
}

export function CommentThread({
  comments,
  currentUserId = null,
  token = null,
  onCommentHidden,
}: CommentThreadProps) {
  if (comments.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No comments yet.</p>;
  }
  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          token={token}
          onHide={onCommentHidden}
        />
      ))}
    </div>
  );
}
