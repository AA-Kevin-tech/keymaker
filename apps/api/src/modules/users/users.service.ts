import { prisma } from "../../db/prisma.js";

export async function getById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      createdAt: true,
      reputationClarity: true,
      reputationEvidence: true,
      reputationNovelty: true,
    },
  });
  return user;
}

export async function getByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      createdAt: true,
      reputationClarity: true,
      reputationEvidence: true,
      reputationNovelty: true,
    },
  });
  return user;
}
