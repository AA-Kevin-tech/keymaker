import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "body is required").trim(),
  postId: z.string().min(1, "postId is required").trim(),
  parentId: z.string().trim().nullable().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
