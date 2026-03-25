import { ReportStatus, UserRestrictionType } from "@prisma/client";
import { z } from "zod";
import {
  MODERATION_REASON_CODES,
  REPORT_ACTION_TYPES,
  REPORT_REASON_CODES,
  REPORT_TARGET_TYPES,
} from "./reports.types.js";

const cuidLike = z.string().min(1).max(64).trim();

export const createReportBodySchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: cuidLike,
  reasonCode: z.enum(REPORT_REASON_CODES),
  reasonText: z.string().max(8000).trim().optional().nullable(),
});

const reportListStatusSchema = z
  .nativeEnum(ReportStatus)
  .or(z.literal("all"))
  .optional();

export const adminReportListQuerySchema = z.object({
  status: reportListStatusSchema,
  targetType: z.enum(REPORT_TARGET_TYPES).optional(),
  reasonCode: z.enum(REPORT_REASON_CODES).optional(),
  communityId: cuidLike.optional(),
  sort: z.enum(["created_at_desc", "created_at_asc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const dismissReportBodySchema = z.object({
  reasonText: z.string().max(8000).trim().optional().nullable(),
});

const reportActionParamsSchema = z
  .object({
    restrictionType: z.nativeEnum(UserRestrictionType).optional(),
    endsAt: z.string().datetime().optional().nullable(),
    communityId: cuidLike.optional().nullable(),
  })
  .optional();

export const reportActionBodySchema = z
  .object({
    actionType: z.enum(REPORT_ACTION_TYPES),
    reasonCode: z.enum(MODERATION_REASON_CODES),
    reasonText: z.string().max(8000).trim().optional().nullable(),
    params: reportActionParamsSchema,
  })
  .superRefine((val, ctx) => {
    if (val.actionType === "restrict_user") {
      const rt = val.params?.restrictionType;
      if (!rt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "params.restrictionType is required for restrict_user",
          path: ["params", "restrictionType"],
        });
      }
    }
  });

export const adminContentReasonBodySchema = z.object({
  reasonCode: z.enum(MODERATION_REASON_CODES),
  reasonText: z.string().max(8000).trim().optional().nullable(),
});
