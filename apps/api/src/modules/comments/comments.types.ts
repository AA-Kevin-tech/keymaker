export interface CreateCommentBody {
  body: string;
  postId: string;
  authorId: string;
  parentId?: string | null;
}
