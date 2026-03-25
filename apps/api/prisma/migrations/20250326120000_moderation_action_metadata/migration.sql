-- Optional structured links for audit trail (related report, user, restriction, moderator note).
ALTER TABLE "moderation_actions" ADD COLUMN "metadata" JSONB;
