export interface CreateModerationActionBody {
  actionType: string;
  targetType: string;
  targetId: string;
  moderatorId: string;
  communityId?: string | null;
  reasonCode?: string | null;
  reason?: string | null;
}
