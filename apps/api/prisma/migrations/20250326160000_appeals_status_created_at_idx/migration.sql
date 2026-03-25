-- Support appeal admin queues filtered by status and ordered by recency.
CREATE INDEX "appeals_status_created_at_idx" ON "appeals"("status", "created_at" DESC);
