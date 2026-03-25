import { ContentDeletionKind } from "@prisma/client";

/** Public lifecycle for soft-deleted content. `active` includes never deleted and after restore. */
export type ContentDeletionState =
  | "active"
  | "author_deleted"
  | "moderator_removed"
  | "legacy_deleted";

export function deriveDeletionState(row: {
  deletedAt: Date | null;
  deletionKind: ContentDeletionKind | null;
}): ContentDeletionState {
  if (!row.deletedAt) return "active";
  if (row.deletionKind === ContentDeletionKind.author_deleted) return "author_deleted";
  if (row.deletionKind === ContentDeletionKind.moderator_removed) return "moderator_removed";
  return "legacy_deleted";
}
