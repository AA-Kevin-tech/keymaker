import { AppealStatus } from "@prisma/client";
import { z } from "zod";
import { MODERATION_REASON_CODES } from "../reports/reports.types.js";
import { createUserRestrictionBodySchema } from "../user-restrictions/user-restrictions.schema.js";

const cuidLike = z.string().min(1).max(64).trim();

export const createAppealBodySchema = z.object({
  moderationActionId: cuidLike,
  appealText: z.string().min(1).max(20000).trim(),
});

export const adminAppealListQuerySchema = z.object({
  status: z
    .union([z.nativeEnum(AppealStatus), z.literal("all")])
    .optional()
    .default(AppealStatus.open),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const appealDecisionBodySchema = z.object({
  decisionNote: z.string().min(1).max(20000).trim(),
});

export const appealReverseBodySchema = appealDecisionBodySchema.extend({
  reasonCode: z.enum(MODERATION_REASON_CODES).optional(),
});

/**
 * Optional follow-up when status = modified: lift specific restrictions and/or add one replacement restriction.
 */
export const appealModifyBodySchema = appealDecisionBodySchema.extend({
  liftRestrictionIds: z.array(cuidLike).max(20).optional(),
  /** Single new restriction row if the panel adjusts sanctions (reuses admin restriction validation). */
  createReplacementRestriction: createUserRestrictionBodySchema.optional(),
  reasonCode: z.enum(MODERATION_REASON_CODES).optional(),
  reasonText: z.string().max(8000).trim().optional().nullable(),
});
