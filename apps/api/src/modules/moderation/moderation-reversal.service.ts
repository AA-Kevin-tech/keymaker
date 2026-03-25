import { type ModerationAction, type Prisma } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import * as moderationService from "./moderation.service.js";
import { deactivateRestrictionTx } from "../user-restrictions/user-restrictions.service.js";

export function parseMeta(metadata: unknown): Record<string, string> {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as Record<string, string>;
}

/**
 * MVP: moderation action types that `reverseAppeal` may apply automatically inside a single DB transaction.
 *
 * | actionType     | Behavior |
 * |----------------|----------|
 * | remove_post    | Restores post if still soft-deleted as `moderator_removed`. Idempotent if already active. Purged/missing post → error (tx rolls back). |
 * | remove_comment | Same for comments. |
 * | restrict_user  | Deactivates restriction in `metadata.restrictionId` if still active. Idempotent if already lifted. Requires metadata restrictionId. |
 *
 * **Not auto-reversed:** `warn_user`, `dismiss_report`, `escalate`, `restore_*`, `lift_restriction`,
 * `restrict_user` without `restrictionId`, or any other `actionType` — use uphold/modify/manual tools.
 */
export const APPEAL_AUTO_REVERSIBLE_ACTION_TYPES = ["remove_post", "remove_comment", "restrict_user"] as const;

export function assertModerationActionReversibleForAppeal(action: ModerationAction): void {
  const t = action.actionType;
  if (!APPEAL_AUTO_REVERSIBLE_ACTION_TYPES.includes(t as (typeof APPEAL_AUTO_REVERSIBLE_ACTION_TYPES)[number])) {
    throw new HttpError(
      400,
      `Appeal reversal is not supported for action type "${t}". ` +
        `Supported: ${APPEAL_AUTO_REVERSIBLE_ACTION_TYPES.join(", ")}.`
    );
  }
  if (t === "restrict_user") {
    const rid = parseMeta(action.metadata).restrictionId;
    if (!rid) {
      throw new HttpError(
        400,
        "Cannot reverse this restriction appeal: moderation metadata is missing restrictionId."
      );
    }
  }
}

/**
 * Apply MVP reversal using the shared transaction client (appeal decision flow).
 * Preconditions: `assertModerationActionReversibleForAppeal` already passed.
 */
export async function applyReversalForModerationActionInTx(
  tx: Prisma.TransactionClient,
  args: {
    original: ModerationAction;
    reviewerId: string;
    appealId: string;
    decisionNote: string;
    reasonCode: string;
  }
): Promise<void> {
  const { original, reviewerId, appealId } = args;
  const meta = parseMeta(original.metadata);
  const reasonText = `Appeal ${appealId} reversed: ${args.decisionNote}`;

  switch (original.actionType) {
    case "remove_post": {
      if (original.targetType !== "post") {
        throw new HttpError(400, "Invalid moderation record for remove_post");
      }
      const post = await tx.post.findUnique({
        where: { id: original.targetId },
        select: { id: true },
      });
      if (!post) {
        throw new HttpError(400, "Post no longer exists (may have been purged); cannot auto-restore");
      }
      await moderationService.restorePostByModeratorInTx(tx, {
        postId: original.targetId,
        moderatorId: reviewerId,
        reasonCode: args.reasonCode,
        reasonText,
      });
      return;
    }
    case "remove_comment": {
      if (original.targetType !== "comment") {
        throw new HttpError(400, "Invalid moderation record for remove_comment");
      }
      const comment = await tx.comment.findUnique({
        where: { id: original.targetId },
        select: { id: true },
      });
      if (!comment) {
        throw new HttpError(400, "Comment no longer exists (may have been purged); cannot auto-restore");
      }
      await moderationService.restoreCommentByModeratorInTx(tx, {
        commentId: original.targetId,
        moderatorId: reviewerId,
        reasonCode: args.reasonCode,
        reasonText,
      });
      return;
    }
    case "restrict_user": {
      const rid = meta.restrictionId;
      if (!rid) {
        throw new HttpError(400, "Cannot reverse restriction: moderation metadata has no restrictionId.");
      }
      await deactivateRestrictionTx(
        tx,
        reviewerId,
        rid,
        { reasonCode: args.reasonCode, reasonText },
        { idempotentIfInactive: true, expectedSubjectUserId: original.targetId }
      );
      return;
    }
    default: {
      throw new HttpError(400, `Automatic reversal is not implemented for action type "${original.actionType}"`);
    }
  }
}
