import type { Prisma } from "@prisma/client";
import { ContentDeletionKind } from "@prisma/client";
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
    include: {
      author: { select: { id: true, username: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getById(id: string, includeDeleted = false) {
  const post = await prisma.post.findFirst({
    where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
    include: {
      author: { select: { id: true, username: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
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
    include: {
      author: { select: { id: true, username: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  });
}

/** Author hide / author DELETE — soft delete, reversible by author if not moderator_removed. */
export async function softDeleteByAuthor(id: string) {
  return prisma.post.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletionKind: ContentDeletionKind.author_deleted,
    },
    include: {
      author: { select: { id: true, username: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function softDeleteTx(
  tx: Prisma.TransactionClient,
  id: string,
  deletionKind: ContentDeletionKind
) {
  return tx.post.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletionKind,
    },
    select: {
      id: true,
      communityId: true,
      authorId: true,
      deletedAt: true,
      deletionKind: true,
    },
  });
}

export async function restore(id: string) {
  return prisma.post.update({
    where: { id },
    data: {
      deletedAt: null,
      deletionKind: null,
    },
    include: {
      author: { select: { id: true, username: true } },
      community: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function restoreTx(tx: Prisma.TransactionClient, id: string) {
  return tx.post.update({
    where: { id },
    data: {
      deletedAt: null,
      deletionKind: null,
    },
    select: { id: true, communityId: true, deletedAt: true, deletionKind: true },
  });
}

/**
 * Irreversible purge: hard delete post, ratings, moderation rows for post and its comments.
 * Platform moderators only (see `POST /api/admin/posts/:id/purge`). Prefer soft delete everywhere else.
 */
export async function purgePostPermanently(id: string) {
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
