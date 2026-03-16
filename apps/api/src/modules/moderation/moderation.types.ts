export interface CreateModerationActionBody {
  actionType: string;
  targetType: string;
  targetId: string;
  moderatorId: string;
  communityId?: string | null;
  reason?: string | null;
}
