import { z } from "zod";
import { SCORE_MIN, SCORE_MAX } from "@keymaker/shared";

const scoreSchema = z.number().int().min(SCORE_MIN).max(SCORE_MAX);

export const upsertRatingSchema = z.object({
  targetType: z.enum(["post", "comment"], { errorMap: () => ({ message: "targetType must be 'post' or 'comment'" }) }),
  targetId: z.string().min(1, "targetId is required").trim(),
  clarity: scoreSchema,
  evidence: scoreSchema,
  kindness: scoreSchema,
  novelty: scoreSchema,
});

export type UpsertRatingInput = z.infer<typeof upsertRatingSchema>;
