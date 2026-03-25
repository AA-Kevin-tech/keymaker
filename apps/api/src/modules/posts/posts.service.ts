import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type { CreatePostBody, UpdatePostBody } from "./posts.types.js";

export async function create(body: CreatePostBody) {
  return prisma.post.create({
    data: {
      title: body.title.trim(),
      body: body.body?.trim() ?? null,
      communityId: body.communityId,
      authorId: body.authorId,
    },
    include: { author: { select: { id: true, username: true } }, community: { select: { id: true, name: true, slug: true } } },
  });
}

export async function getById(id: string, includeDeleted = false) {
  const post = await prisma.post.findFirst({
    where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
    include: { author: { select: { id: true, username: true } }, community: { select: { id: true, name: true, slug: true } } },
  });
  return post;
}

export async function update(id: string, body: UpdatePostBody) {
  return prisma.post.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.body !== undefined && { body: body.body?.trim() ?? null }),
    },
    include: { author: { select: { id: true, username: true } }, community: { select: { id: true, name: true, slug: true } } },
  });
}

export async function softDelete(id: string) {
  return prisma.post.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { author: { select: { id: true, username: true } }, community: { select: { id: true, name: true, slug: true } } },
  });
}

export async function softDeleteTx(
  tx: Prisma.TransactionClient,
  id: string
): Promise<{ id: string; communityId: string; deletedAt: Date | null }> {
  return tx.post.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, communityId: true, deletedAt: true },
  });
}

export async function restore(id: string) {
  return prisma.post.update({
    where: { id },
    data: { deletedAt: null },
    include: { author: { select: { id: true, username: true } }, community: { select: { id: true, name: true, slug: true } } },
  });
}

export async function restoreTx(
  tx: Prisma.TransactionClient,
  id: string
): Promise<{ id: string; communityId: string; deletedAt: Date | null }> {
  return tx.post.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, communityId: true, deletedAt: true },
  });
}

/** Permanently remove post (author-only via controller). Comments cascade; ratings and moderation rows for the post and its comments are removed first. */
export async function removePermanently(id: string) {
  const commentIds = (
    await prisma.comment.findMany({
      where: { postId: id },
      select: { id: true },
    })
  ).map((c) => c.id);

  await prisma.$transaction([
    prisma.rating.deleteMany({ where: { targetType: "post", targetId: id } }),
    ...(commentIds.length > 0
      ? [
          prisma.rating.deleteMany({
            where: { targetType: "comment", targetId: { in: commentIds } },
          }),
          prisma.moderationAction.deleteMany({
            where: { targetType: "comment", targetId: { in: commentIds } },
          }),
        ]
      : []),
    prisma.moderationAction.deleteMany({ where: { targetType: "post", targetId: id } }),
    prisma.post.delete({ where: { id } }),
  ]);
}
