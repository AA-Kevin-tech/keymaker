import type { ReportStatus } from "@prisma/client";

export const REPORT_TARGET_TYPES = ["post", "comment", "user"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

/** MVP reason taxonomy — keep in sync with admin tooling / UI copy. */
export const REPORT_REASON_CODES = [
  "spam",
  "harassment",
  "hate",
  "misinformation",
  "off_topic",
  "copyright",
  "self_harm",
  "other",
] as const;
export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];

export const MODERATION_REASON_CODES = [...REPORT_REASON_CODES] as const;
export type ModerationReasonCode = (typeof MODERATION_REASON_CODES)[number];

/** Why a report was closed without a punitive action (distinct from content-violation codes). */
export const DISMISS_REASON_CODES = [
  "no_policy_violation",
  "duplicate_report",
  "insufficient_evidence",
  "handled_elsewhere",
  "reporter_withdrew",
  "other",
] as const;
export type DismissReasonCode = (typeof DISMISS_REASON_CODES)[number];

export const REPORT_ACTION_TYPES = [
  "remove_post",
  "remove_comment",
  "warn_user",
  "restrict_user",
  "escalate",
] as const;
export type ReportActionType = (typeof REPORT_ACTION_TYPES)[number];

export type CreateReportBody = {
  targetType: ReportTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  reasonText?: string | null;
};

export type AdminReportListQuery = {
  status?: ReportStatus | "all";
  targetType?: ReportTargetType;
  reasonCode?: ReportReasonCode;
  communityId?: string;
  sort?: "created_at_desc" | "created_at_asc";
  page?: number;
  pageSize?: number;
};

export type DismissReportBody = {
  reasonCode?: DismissReasonCode;
  reasonText?: string | null;
};

export type ReportActionBody = {
  actionType: ReportActionType;
  reasonCode: ModerationReasonCode;
  reasonText?: string | null;
  params?: {
    restrictionType?: "posting_block" | "rating_block" | "temp_suspend" | "permanent_ban";
    endsAt?: string | null;
    communityId?: string | null;
  };
};
