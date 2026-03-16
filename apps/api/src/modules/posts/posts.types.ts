export interface CreatePostBody {
  title: string;
  body?: string | null;
  communityId: string;
  authorId: string;
}

export interface UpdatePostBody {
  title?: string;
  body?: string | null;
}
