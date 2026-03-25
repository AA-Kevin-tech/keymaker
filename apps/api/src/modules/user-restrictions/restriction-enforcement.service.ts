/**
 * Central enforcement for active user_restrictions on production write paths.
 *
 * **Community scoping**
 * - Load all active rows for the user (`isActive`, not past `endsAt`).
 * - A row applies if `communityId` is null (platform-wide for every community) OR `communityId` matches the
 *   content’s community (post/comment/rating target / report context).
 * - If the action has no community (user-target report), only platform-wide rows apply; community-scoped
 *   sanctions do not block reporting on “global” context.
 *
 * **Routes wired through this module**
 * | Route | Service | Capability |
 * |-------|---------|------------|
 * | `POST /api/posts` | `posts.service.create` | posting (+ suspend/ban) |
 * | `PATCH /api/posts/:id` | `posts.service.update` | posting |
 * | `DELETE /api/posts/:id` (author) | `posts.service.softDeleteByAuthor` | posting |
 * | `POST /api/posts/:id/hide` | same | posting |
 * | `POST /api/posts/:id/restore` | `posts.service.restore` | posting |
 * | `POST /api/comments` | `comments.service.create` | posting |
 * | `POST /api/comments/:id/hide` | `comments.service.softDeleteByAuthor` | posting |
 * | `POST /api/comments/:id/restore` | `comments.service.restore` | posting |
 * | `PUT /api/ratings` | `ratings.service.upsertRating` | rating (+ suspend/ban) |
 * | `POST /api/reports` | `reports.service.createReport` | suspend/ban only (`REPORTING_BLOCKED`) |
 * | `POST /api/communities` | `communities.service.create` | `temp_suspend` / `permanent_ban` with no community context (platform-wide rows only for create) |
 * | `PATCH /api/communities/:slug` | `communities.service.updateSettings` | same hard stops, scoped to that community + platform-wide |
 *
 * **Restriction semantics**
 * - `posting_block`: blocks post/comment create/edit (author hide/restore) via `assertUserMayPostInCommunity`.
 * - `rating_block`: blocks `PUT /api/ratings` via `assertUserMayRateInCommunity`.
 * - `temp_suspend` / `permanent_ban`: block posting and rating paths; also block reporting (suspend/ban);
 *   block community create and community settings updates (hard stop).
 *
 * Not gated: auth, read-only routes, `POST /api/appeals` (due process), `/api/admin/*`, moderation log reads.
 */
import { UserRestrictionType } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";

/** Machine-readable codes returned in JSON `{ error, code }` (see `errorMiddleware` / `HttpError`). */
export const RESTRICTION_ERROR_CODES = {
  POSTING_BLOCKED: "POSTING_BLOCKED",
  RATING_BLOCKED: "RATING_BLOCKED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_BANNED: "ACCOUNT_BANNED",
  REPORTING_BLOCKED: "REPORTING_BLOCKED",
} as const;

export type RestrictionErrorCode = (typeof RESTRICTION_ERROR_CODES)[keyof typeof RESTRICTION_ERROR_CODES];

function applicableRows(
  rows: { restrictionType: UserRestrictionType; communityId: string | null }[],
  /** Community of the content being acted on; null means platform-only context. */
  communityId: string | null
) {
  return rows.filter((r) => {
    if (r.communityId === null) {
      return true;
    }
    if (communityId === null) {
      return false;
    }
    return r.communityId === communityId;
  });
}

async function loadActiveRestrictions(userId: string, now: Date) {
  return prisma.userRestriction.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    select: { restrictionType: true, communityId: true },
  });
}

function pickPostingViolation(types: UserRestrictionType[]): {
  code: RestrictionErrorCode;
  message: string;
} | null {
  const set = new Set(types);
  if (set.has(UserRestrictionType.permanent_ban)) {
    return {
      code: RESTRICTION_ERROR_CODES.ACCOUNT_BANNED,
      message: "Your account is permanently banned from participating.",
    };
  }
  if (set.has(UserRestrictionType.temp_suspend)) {
    return {
      code: RESTRICTION_ERROR_CODES.ACCOUNT_SUSPENDED,
      message: "Your account is suspended and cannot post or comment.",
    };
  }
  if (set.has(UserRestrictionType.posting_block)) {
    return {
      code: RESTRICTION_ERROR_CODES.POSTING_BLOCKED,
      message: "You are blocked from posting in this community.",
    };
  }
  return null;
}

function pickRatingViolation(types: UserRestrictionType[]): {
  code: RestrictionErrorCode;
  message: string;
} | null {
  const set = new Set(types);
  if (set.has(UserRestrictionType.permanent_ban)) {
    return {
      code: RESTRICTION_ERROR_CODES.ACCOUNT_BANNED,
      message: "Your account is permanently banned from participating.",
    };
  }
  if (set.has(UserRestrictionType.temp_suspend)) {
    return {
      code: RESTRICTION_ERROR_CODES.ACCOUNT_SUSPENDED,
      message: "Your account is suspended and cannot rate content.",
    };
  }
  if (set.has(UserRestrictionType.rating_block)) {
    return {
      code: RESTRICTION_ERROR_CODES.RATING_BLOCKED,
      message: "You are blocked from rating in this community.",
    };
  }
  return null;
}

/** Suspend/ban only: limits filing reports (reduces abuse from sanctioned accounts). */
function pickReportingViolation(types: UserRestrictionType[]): {
  code: RestrictionErrorCode;
  message: string;
} | null {
  const set = new Set(types);
  if (set.has(UserRestrictionType.permanent_ban)) {
    return {
      code: RESTRICTION_ERROR_CODES.REPORTING_BLOCKED,
      message: "You cannot file reports while this sanction is active.",
    };
  }
  if (set.has(UserRestrictionType.temp_suspend)) {
    return {
      code: RESTRICTION_ERROR_CODES.REPORTING_BLOCKED,
      message: "You cannot file reports while suspended.",
    };
  }
  return null;
}

/** Ban or temp suspend only (e.g. community meta-actions where posting/rating blocks do not apply). */
function pickHardParticipationStop(types: UserRestrictionType[]): {
  code: RestrictionErrorCode;
  message: string;
} | null {
  const set = new Set(types);
  if (set.has(UserRestrictionType.permanent_ban)) {
    return {
      code: RESTRICTION_ERROR_CODES.ACCOUNT_BANNED,
      message: "Your account is permanently banned from participating.",
    };
  }
  if (set.has(UserRestrictionType.temp_suspend)) {
    return {
      code: RESTRICTION_ERROR_CODES.ACCOUNT_SUSPENDED,
      message: "Your account is suspended and cannot perform this action.",
    };
  }
  return null;
}

/**
 * Creating a community has no target community yet: only platform-wide (`community_id` null) rows apply
 * for hard stops. Community-scoped sanctions do not block creating a new community.
 */
export async function assertUserMayCreateCommunity(userId: string): Promise<void> {
  const rows = await loadActiveRestrictions(userId, new Date());
  const applicable = applicableRows(rows, null);
  const hit = pickHardParticipationStop(applicable.map((r) => r.restrictionType));
  if (hit) {
    throw new HttpError(403, hit.message, hit.code);
  }
}

/**
 * Updating community settings is gated like other high-impact writes: ban/suspend for this community
 * or platform-wide. `posting_block` / `rating_block` do not block settings changes.
 */
export async function assertUserMayUpdateCommunitySettings(
  userId: string,
  communityId: string
): Promise<void> {
  const rows = await loadActiveRestrictions(userId, new Date());
  const applicable = applicableRows(rows, communityId);
  const hit = pickHardParticipationStop(applicable.map((r) => r.restrictionType));
  if (hit) {
    throw new HttpError(403, hit.message, hit.code);
  }
}

/**
 * Post create/update, comment create, author hide/restore/delete for posts and comments.
 * @param communityId Community of the post or comment being created or modified.
 */
export async function assertUserMayPostInCommunity(userId: string, communityId: string): Promise<void> {
  const rows = await loadActiveRestrictions(userId, new Date());
  const applicable = applicableRows(rows, communityId);
  const types = applicable.map((r) => r.restrictionType);
  const hit = pickPostingViolation(types);
  if (hit) {
    throw new HttpError(403, hit.message, hit.code);
  }
}

/**
 * PUT /api/ratings — community derived from rated post/comment.
 */
export async function assertUserMayRateInCommunity(
  userId: string,
  communityId: string | null
): Promise<void> {
  const rows = await loadActiveRestrictions(userId, new Date());
  const applicable = applicableRows(rows, communityId);
  const types = applicable.map((r) => r.restrictionType);
  const hit = pickRatingViolation(types);
  if (hit) {
    throw new HttpError(403, hit.message, hit.code);
  }
}

/**
 * File report: blocked only for temp_suspend / permanent_ban (scoped or platform).
 */
export async function assertUserMayFileReport(
  userId: string,
  reportCommunityId: string | null
): Promise<void> {
  const rows = await loadActiveRestrictions(userId, new Date());
  const applicable = applicableRows(rows, reportCommunityId);
  const types = applicable.map((r) => r.restrictionType);
  const hit = pickReportingViolation(types);
  if (hit) {
    throw new HttpError(403, hit.message, hit.code);
  }
}

export async function resolveCommunityIdForRatingTarget(
  targetType: "post" | "comment",
  targetId: string
): Promise<string | null> {
  if (targetType === "post") {
    const p = await prisma.post.findUnique({
      where: { id: targetId },
      select: { communityId: true },
    });
    return p?.communityId ?? null;
  }
  const c = await prisma.comment.findUnique({
    where: { id: targetId },
    select: { postId: true },
  });
  if (!c) return null;
  const p = await prisma.post.findUnique({
    where: { id: c.postId },
    select: { communityId: true },
  });
  return p?.communityId ?? null;
}
