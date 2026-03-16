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
    include: { author: { select: { id: true, username: true } } },
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
    include: { author: { select: { id: true, username: true } } },
  });
}

export async function softDelete(id: string) {
  return prisma.post.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
