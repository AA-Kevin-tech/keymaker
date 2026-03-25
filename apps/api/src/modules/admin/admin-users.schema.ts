import { ModeratorRoleName } from "@prisma/client";
import { z } from "zod";
import { MODERATION_REASON_CODES } from "../reports/reports.types.js";

const cuidLike = z.string().min(1).max(64).trim();

/** Query params for GET /api/admin/users. Community mods only see users tied to their communities (see service). */
export const adminUserListQuerySchema = z.object({
  hasActiveRestrictions: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  /** Restrict to users who hold this moderator role (any scope). */
  role: z.nativeEnum(ModeratorRoleName).optional(),
  /** Users with posts or scoped restrictions in this community. */
  communityId: cuidLike.optional(),
  /** If set, only users with any moderation_action in the last N days (scoped; see service). */
  recentModerationDays: z.coerce.number().int().min(1).max(365).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminWarnUserBodySchema = z.object({
  reasonCode: z.enum(MODERATION_REASON_CODES),
  reasonText: z.string().max(8000).trim().optional().nullable(),
  communityId: cuidLike.optional().nullable(),
  /** When true (default), also creates a moderator_note row (same as report warn_user flow). */
  addModeratorNote: z.boolean().optional().default(true),
});

export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>;
