-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'dismissed', 'actioned');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('open', 'upheld', 'reversed', 'modified', 'closed');

-- CreateEnum
CREATE TYPE "UserRestrictionType" AS ENUM ('posting_block', 'rating_block', 'temp_suspend', 'permanent_ban');

-- CreateEnum
CREATE TYPE "ModeratorRoleName" AS ENUM ('super_admin', 'platform_moderator', 'community_admin', 'community_moderator');

-- AlterTable
ALTER TABLE "moderation_actions" ADD COLUMN "reason_code" TEXT;

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "reason_text" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_restrictions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "restriction_type" "UserRestrictionType" NOT NULL,
    "community_id" TEXT,
    "reason_code" TEXT,
    "reason_text" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" TEXT NOT NULL,
    "moderation_action_id" TEXT NOT NULL,
    "appellant_id" TEXT NOT NULL,
    "appeal_text" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'open',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderator_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "moderator_id" TEXT NOT NULL,
    "community_id" TEXT,
    "note_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderator_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderator_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "community_id" TEXT,
    "role_name" "ModeratorRoleName" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderator_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "user_restrictions_user_id_is_active_idx" ON "user_restrictions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_restrictions_community_id_idx" ON "user_restrictions"("community_id");

-- CreateIndex
CREATE INDEX "user_restrictions_ends_at_idx" ON "user_restrictions"("ends_at");

-- CreateIndex
CREATE INDEX "appeals_status_idx" ON "appeals"("status");

-- CreateIndex
CREATE INDEX "appeals_moderation_action_id_idx" ON "appeals"("moderation_action_id");

-- CreateIndex
CREATE INDEX "appeals_appellant_id_idx" ON "appeals"("appellant_id");

-- CreateIndex
CREATE INDEX "appeals_created_at_idx" ON "appeals"("created_at");

-- CreateIndex
CREATE INDEX "moderator_notes_user_id_idx" ON "moderator_notes"("user_id");

-- CreateIndex
CREATE INDEX "moderator_notes_moderator_id_idx" ON "moderator_notes"("moderator_id");

-- CreateIndex
CREATE INDEX "moderator_notes_community_id_idx" ON "moderator_notes"("community_id");

-- CreateIndex
CREATE INDEX "moderator_roles_user_id_idx" ON "moderator_roles"("user_id");

-- CreateIndex
CREATE INDEX "moderator_roles_community_id_idx" ON "moderator_roles"("community_id");

-- CreateIndex
CREATE INDEX "moderator_roles_role_name_idx" ON "moderator_roles"("role_name");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_moderation_action_id_fkey" FOREIGN KEY ("moderation_action_id") REFERENCES "moderation_actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_appellant_id_fkey" FOREIGN KEY ("appellant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderator_notes" ADD CONSTRAINT "moderator_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderator_notes" ADD CONSTRAINT "moderator_notes_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderator_notes" ADD CONSTRAINT "moderator_notes_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderator_roles" ADD CONSTRAINT "moderator_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderator_roles" ADD CONSTRAINT "moderator_roles_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique: one platform role name per user (community_id IS NULL)
CREATE UNIQUE INDEX "moderator_roles_platform_user_role_key" ON "moderator_roles" ("user_id", "role_name") WHERE "community_id" IS NULL;

-- Partial unique: one role name per user per community
CREATE UNIQUE INDEX "moderator_roles_community_user_role_key" ON "moderator_roles" ("user_id", "community_id", "role_name") WHERE "community_id" IS NOT NULL;
