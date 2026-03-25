-- Distinguish author-initiated soft delete from moderator removal (reversibility and policy).
CREATE TYPE "ContentDeletionKind" AS ENUM ('author_deleted', 'moderator_removed');

ALTER TABLE "posts" ADD COLUMN "deletion_kind" "ContentDeletionKind";

ALTER TABLE "comments" ADD COLUMN "deletion_kind" "ContentDeletionKind";
