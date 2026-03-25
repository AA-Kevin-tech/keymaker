import { ModeratorRoleName } from "@prisma/client";
import { prisma } from "../../db/prisma.js";

/** Roles that may access `/api/admin/*` (platform scope). Community-only roles use separate routes in later phases. */
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

/**
 * Expandable hook for per-community checks (Phase 3+).
 */
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

export function getPlatformStaffRoles(): readonly ModeratorRoleName[] {
  return PLATFORM_STAFF_ROLES;
}
