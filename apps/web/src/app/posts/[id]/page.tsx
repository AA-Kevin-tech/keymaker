import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
import { PostView } from "@/components/post/PostView";
import { PostNotFoundOrHidden } from "@/components/post/PostNotFoundOrHidden";
import type { Post, Comment } from "@/lib/types";

interface Params {
  id: string;
}

async function getPost(id: string): Promise<Post | null> {
  try {
    return await api.get<Post>(`/posts/${id}`);
  } catch {
    return null;
  }
}

async function getComments(postId: string): Promise<Comment[]> {
  try {
    const res = await api.get<{ comments: Comment[] }>(`/comments/by-post/${postId}`);
    return res.comments;
  } catch {
    return [];
  }
}

export default async function PostPage({ params }: { params: Params }) {
  const postId = params.id;
  const [post, comments] = await Promise.all([
    getPost(postId),
    getComments(postId),
  ]);

  if (!post) {
    return <PostNotFoundOrHidden postId={postId} />;
  }

  return <PostView post={post} comments={comments} />;
}
