import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

/**
 * Single write path for moderation_actions so metadata stays consistent.
 * Tradeoff: `ModerationAction` has no JSON metadata column; optional fields like related_report_id
 * are not persisted in Phase 1 schema — embed references in reason text or extend schema later.
 */
export type RecordModerationActionInput = {
  moderatorId: string;
  communityId?: string | null;
  actionType: string;
  targetType: string;
  targetId: string;
  reasonCode?: string | null;
  reasonText?: string | null;
};

export async function recordModerationAction(
  input: RecordModerationActionInput,
  tx: Prisma.TransactionClient | null = null
) {
  const db = tx ?? prisma;
  return db.moderationAction.create({
    data: {
      moderatorId: input.moderatorId,
      communityId: input.communityId ?? null,
      actionType: input.actionType,
      targetType: input.targetType,
      targetId: input.targetId,
      reasonCode: input.reasonCode ?? null,
      reason: input.reasonText ?? null,
    },
  });
}
