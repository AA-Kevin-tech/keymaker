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
