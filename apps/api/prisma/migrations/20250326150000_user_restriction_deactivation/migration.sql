-- Reversible restrictions: who lifted and when (row stays for history).
ALTER TABLE "user_restrictions" ADD COLUMN "deactivated_at" TIMESTAMP(3),
ADD COLUMN "deactivated_by" TEXT;

ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_deactivated_by_fkey" FOREIGN KEY ("deactivated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
