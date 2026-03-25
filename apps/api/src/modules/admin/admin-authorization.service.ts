import { ModeratorRoleName } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";

const COMMUNITY_MOD_ROLES: ModeratorRoleName[] = [
  ModeratorRoleName.community_admin,
  ModeratorRoleName.community_moderator,
];

/** Roles that may access platform-wide moderation (`super_admin` / `platform_moderator`). */
const PLATFORM_STAFF_ROLES: ModeratorRoleName[] = [
  ModeratorRoleName.super_admin,
  ModeratorRoleName.platform_moderator,
];

export async function listPlatformRoleNames(userId: string): Promise<ModeratorRoleName[]> {
  const rows = await prisma.moderatorRole.findMany({
    where: { userId, communityId: null },
    select: { roleName: true },
  });
  return rows.map((r) => r.roleName);
}

export async function isPlatformStaff(userId: string): Promise<boolean> {
  const roles = await listPlatformRoleNames(userId);
  return roles.some((r) => PLATFORM_STAFF_ROLES.includes(r));
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const roles = await listPlatformRoleNames(userId);
  return roles.includes(ModeratorRoleName.super_admin);
}

export async function listCommunityRoleNames(
  userId: string,
  communityId: string
): Promise<ModeratorRoleName[]> {
  const rows = await prisma.moderatorRole.findMany({
    where: { userId, communityId },
    select: { roleName: true },
  });
  return rows.map((r) => r.roleName);
}

/** Community IDs where the user may moderate content (community_admin or community_moderator). */
export async function listModeratableCommunityIds(userId: string): Promise<string[]> {
  const rows = await prisma.moderatorRole.findMany({
    where: {
      userId,
      communityId: { not: null },
      roleName: { in: [...COMMUNITY_MOD_ROLES] },
    },
    select: { communityId: true },
  });
  return [...new Set(rows.map((r) => r.communityId!).filter(Boolean))];
}

/** True if the user is platform staff or has any moderator role row (platform or community). */
export async function canAccessAdminArea(userId: string): Promise<boolean> {
  if (await isPlatformStaff(userId)) return true;
  const count = await prisma.moderatorRole.count({ where: { userId } });
  return count > 0;
}

/**
 * Enforce access for moderation objects tied to a community.
 * `communityId` null means platform-wide-only (e.g. user-target reports with no community context).
 */
export async function assertModeratorCommunityAccess(
  moderatorId: string,
  communityId: string | null
): Promise<void> {
  if (await isPlatformStaff(moderatorId)) return;
  if (communityId === null) {
    throw new HttpError(403, "This item is limited to platform moderators");
  }
  const allowed = await listModeratableCommunityIds(moderatorId);
  if (!allowed.includes(communityId)) {
    throw new HttpError(403, "You cannot moderate content in this community");
  }
}

export function getPlatformStaffRoles(): readonly ModeratorRoleName[] {
  return PLATFORM_STAFF_ROLES;
}
