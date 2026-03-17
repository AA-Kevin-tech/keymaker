import { z } from "zod";

export const createModerationActionSchema = z.object({
  actionType: z.string().min(1, "actionType is required").trim(),
  targetType: z.string().min(1, "targetType is required").trim(),
  targetId: z.string().min(1, "targetId is required").trim(),
  communityId: z.string().trim().nullable().optional(),
  reason: z.string().trim().nullable().optional(),
});

export type CreateModerationActionInput = z.infer<typeof createModerationActionSchema>;
