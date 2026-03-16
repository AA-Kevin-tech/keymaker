import { CommentItem } from "./CommentItem";
import type { Comment } from "@/lib/types";

interface CommentThreadProps {
  comments: Comment[];
}

export function CommentThread({ comments }: CommentThreadProps) {
  if (comments.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No comments yet.</p>;
  }
  return (
    <div className="space-y-0">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
