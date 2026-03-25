import type { AppealStatus } from "@prisma/client";

export type CreateAppealBody = {
  moderationActionId: string;
  appealText: string;
};

export type AdminAppealListQuery = {
  status: AppealStatus | "all";
  page: number;
  pageSize: number;
};

export type AppealModerationSummary = {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  communityId: string | null;
  reasonCode: string | null;
  reasonText: string | null;
  createdAt: string;
};

export type AppealAppellantSummary = {
  id: string;
  username: string;
};
