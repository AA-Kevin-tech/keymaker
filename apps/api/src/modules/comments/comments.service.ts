import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type { CreateCommentBody } from "./comments.types.js";

export async function create(body: CreateCommentBody) {
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

export async function softDelete(id: string) {
  return prisma.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function softDeleteTx(tx: Prisma.TransactionClient, id: string) {
  return tx.comment.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, postId: true, deletedAt: true },
  });
}

export async function restore(id: string) {
  return prisma.comment.update({
    where: { id },
    data: { deletedAt: null },
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function restoreTx(tx: Prisma.TransactionClient, id: string) {
  return tx.comment.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, postId: true, deletedAt: true },
  });
}
