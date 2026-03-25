import type { Prisma } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import { assertCanViewAdminUser } from "../user-restrictions/user-restrictions.service.js";
import * as adminAuth from "../admin/admin-authorization.service.js";
import type { AddModeratorNoteBody } from "./moderator-notes.types.js";
import type { ModeratorNoteListItem } from "./moderator-notes.types.js";

const noteInclude = {
  moderator: { select: { id: true, username: true } },
  community: { select: { id: true, name: true, slug: true } },
} as const;

function serialize(
  row: Prisma.ModeratorNoteGetPayload<{ include: typeof noteInclude }>
): ModeratorNoteListItem {
  return {
    id: row.id,
    userId: row.userId,
    moderatorId: row.moderatorId,
    communityId: row.communityId,
    community: row.community,
    noteText: row.noteText,
    createdAt: row.createdAt.toISOString(),
    moderator: row.moderator,
  };
}

/**
 * Notes are internal: only callers that already passed admin auth + subject scope should list.
 * Community mods: notes tied to null community or their communities; platform staff: all.
 */
export async function listNotesForAdminUser(
  moderatorId: string,
  subjectUserId: string
): Promise<ModeratorNoteListItem[]> {
  await assertCanViewAdminUser(moderatorId, subjectUserId);
  const platform = await adminAuth.isPlatformStaff(moderatorId);
  const where: Prisma.ModeratorNoteWhereInput = { userId: subjectUserId };

  if (!platform) {
    const ids = await adminAuth.listModeratableCommunityIds(moderatorId);
    /** Community moderators do not see platform-wide (`communityId` null) notes. */
    where.communityId = { in: ids };
  }

  const rows = await prisma.moderatorNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: noteInclude,
  });
  return rows.map(serialize);
}

export async function addNoteFromAdmin(
  moderatorId: string,
  subjectUserId: string,
  body: AddModeratorNoteBody
) {
  await assertCanViewAdminUser(moderatorId, subjectUserId);
  const communityId = body.communityId?.trim() || null;
  if (communityId) {
    await adminAuth.assertModeratorCommunityAccess(moderatorId, communityId);
  } else if (!(await adminAuth.isPlatformStaff(moderatorId))) {
    throw new HttpError(403, "Only platform staff can add platform-wide moderator notes");
  }

  const row = await prisma.moderatorNote.create({
    data: {
      userId: subjectUserId,
      moderatorId,
      communityId,
      noteText: body.noteText.trim(),
    },
    include: noteInclude,
  });
  return serialize(row);
}
