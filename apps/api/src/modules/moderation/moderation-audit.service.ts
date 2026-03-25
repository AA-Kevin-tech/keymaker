import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

/**
 * Canonical write path for `moderation_actions`. All services must use `logModerationAction`.
 * DB column `reason` stores the value supplied as `reasonText` here (legacy name in schema).
 */
export const MODERATION_AUDIT_ACTION_TYPES = [
  "appeal_modified",
  "appeal_reversed",
  "appeal_upheld",
  "dismiss_report",
  "escalate",
  "lift_restriction",
  "remove_post",
  "remove_comment",
  "restore_post",
  "restore_comment",
  "restrict_user",
  "warn_user",
] as const;

export type ModerationAuditActionType = (typeof MODERATION_AUDIT_ACTION_TYPES)[number];

/** Stored in `metadata` JSON on `moderation_actions`. */
export type ModerationActionMetadata = {
  relatedReportId?: string;
  targetUserId?: string;
  restrictionId?: string;
  noteId?: string;
  appealId?: string;
};

export type LogModerationActionInput = {
  moderatorId: string;
  communityId?: string | null;
  actionType: string;
  targetType: string;
  targetId: string;
  reasonCode?: string | null;
  reasonText?: string | null;
  metadata?: ModerationActionMetadata | null;
};

function toPrismaMetadata(
  metadata: ModerationActionMetadata | null | undefined
): Prisma.InputJsonValue | undefined {
  if (metadata === null || metadata === undefined) return undefined;
  const cleaned = Object.fromEntries(
    Object.entries(metadata).filter(
      ([, v]) => v !== undefined && v !== null && String(v).length > 0
    )
  ) as Record<string, string>;
  if (Object.keys(cleaned).length === 0) return undefined;
  return cleaned as Prisma.InputJsonValue;
}

export async function logModerationAction(
  input: LogModerationActionInput,
  tx: Prisma.TransactionClient | null = null
) {
  const db = tx ?? prisma;
  const meta = toPrismaMetadata(input.metadata ?? null);
  return db.moderationAction.create({
    data: {
      moderatorId: input.moderatorId,
      communityId: input.communityId ?? null,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId,
      reasonCode: input.reasonCode ?? null,
      reason: input.reasonText ?? null,
      ...(meta !== undefined ? { metadata: meta } : {}),
    },
  });
}
