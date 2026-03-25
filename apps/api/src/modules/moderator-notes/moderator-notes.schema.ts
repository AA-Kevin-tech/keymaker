import { z } from "zod";

const cuidLike = z.string().min(1).max(64).trim();

export const addModeratorNoteBodySchema = z.object({
  noteText: z.string().min(1).max(20000).trim(),
  communityId: cuidLike.optional().nullable(),
});
