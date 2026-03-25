import { UserRestrictionType } from "@prisma/client";
import { z } from "zod";
import { MODERATION_REASON_CODES } from "../reports/reports.types.js";

const cuidLike = z.string().min(1).max(64).trim();

export const createUserRestrictionBodySchema = z
  .object({
    restrictionType: z.nativeEnum(UserRestrictionType),
    communityId: cuidLike.optional().nullable(),
    reasonCode: z.enum(MODERATION_REASON_CODES),
    reasonText: z.string().max(8000).trim().optional().nullable(),
    endsAt: z.string().datetime().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.restrictionType === UserRestrictionType.temp_suspend && !val.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endsAt is required for temp_suspend",
        path: ["endsAt"],
      });
    }
  });

/**
 * POST /api/admin/users/:id/unrestrict — resolve an active restriction to lift.
 * Provide `restrictionId` or (`restrictionType` + optional `communityId` to disambiguate).
 */
export const unrestrictUserBodySchema = z
  .object({
    restrictionId: cuidLike.optional(),
    restrictionType: z.nativeEnum(UserRestrictionType).optional(),
    communityId: cuidLike.optional().nullable(),
    reasonCode: z.enum(MODERATION_REASON_CODES).optional(),
    reasonText: z.string().max(8000).trim().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (!val.restrictionId && !val.restrictionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "restrictionId or restrictionType is required",
        path: ["restrictionId"],
      });
    }
  });

/** Alias for POST …/restrict — same shape as create restriction from admin. */
export const restrictUserBodySchema = createUserRestrictionBodySchema;
