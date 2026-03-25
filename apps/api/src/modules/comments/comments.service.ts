import type { Prisma } from "@prisma/client";
import { ContentDeletionKind } from "@prisma/client";
import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import { assertUserMayPostInCommunity } from "../user-restrictions/restriction-enforcement.service.js";
import type { CreateCommentBody } from "./comments.types.js";

export async function create(body: CreateCommentBody) {
  const post = await prisma.post.findUnique({
    where: { id: body.postId },
    select: { communityId: true },
  });
  if (!post) {
    throw new HttpError(404, "Post not found");
  }
  await assertUserMayPostInCommunity(body.authorId, post.communityId);
  return prisma.comment.create({
    data: {
      body: body.body.trim(),
      postId: body.postId,
      authorId: body.authorId,
      parentId: body.parentId?.trim() || null,
    },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function listByPostId(postId: string, includeDeleted = false) {
  return prisma.comment.findMany({
    where: { postId, ...(includeDeleted ? {} : { deletedAt: null }) },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function getById(id: string, includeDeleted = false) {
  return prisma.comment.findFirst({
    where: { id, ...(includeDeleted ? {} : { deletedAt: null }) },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function softDeleteByAuthor(id: string) {
  const c = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, postId: true },
  });
  if (!c) {
    throw new HttpError(404, "Comment not found");
  }
  const post = await prisma.post.findUnique({
    where: { id: c.postId },
    select: { communityId: true },
  });
  if (!post) {
    throw new HttpError(400, "Parent post missing");
  }
  await assertUserMayPostInCommunity(c.authorId, post.communityId);
  return prisma.comment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletionKind: ContentDeletionKind.author_deleted,
    },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function softDeleteTx(
  tx: Prisma.TransactionClient,
  id: string,
  deletionKind: ContentDeletionKind
) {
  return tx.comment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletionKind,
    },
    select: {
      id: true,
      postId: true,
      authorId: true,
      deletedAt: true,
      deletionKind: true,
    },
  });
}

export async function restore(id: string) {
  const c = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, postId: true },
  });
  if (!c) {
    throw new HttpError(404, "Comment not found");
  }
  const post = await prisma.post.findUnique({
    where: { id: c.postId },
    select: { communityId: true },
  });
  if (!post) {
    throw new HttpError(400, "Parent post missing");
  }
  await assertUserMayPostInCommunity(c.authorId, post.communityId);
  return prisma.comment.update({
    where: { id },
    data: {
      deletedAt: null,
      deletionKind: null,
    },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function restoreTx(tx: Prisma.TransactionClient, id: string) {
  return tx.comment.update({
    where: { id },
    data: {
      deletedAt: null,
      deletionKind: null,
    },
    select: { id: true, postId: true, deletedAt: true, deletionKind: true },
  });
}

/** Platform-only irreversible purge (see `POST /api/admin/comments/:id/purge`). */
export async function purgeCommentPermanently(id: string) {
  await prisma.$transaction([
    prisma.rating.deleteMany({ where: { targetType: "comment", targetId: id } }),
    prisma.moderationAction.deleteMany({ where: { targetType: "comment", targetId: id } }),
    prisma.comment.delete({ where: { id } }),
  ]);
}
