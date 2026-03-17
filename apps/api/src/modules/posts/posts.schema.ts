import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "title is required").trim().max(500),
  body: z.string().trim().nullable().optional(),
  communityId: z.string().min(1, "communityId is required").trim(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).trim().max(500).optional(),
  body: z.string().trim().nullable().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
