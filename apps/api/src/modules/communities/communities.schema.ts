import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(1, "name is required").trim(),
  slug: z
    .string()
    .min(1, "slug is required")
    .transform((s) => s.toLowerCase().trim().replace(/\s+/g, "-"))
    .refine((s) => /^[a-z0-9-]+$/.test(s), "slug must be alphanumeric and hyphens only"),
  weightClarity: z.number().optional(),
  weightEvidence: z.number().optional(),
  weightKindness: z.number().optional(),
  weightNovelty: z.number().optional(),
  decayHalfLifeSeconds: z.number().int().positive().optional(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
