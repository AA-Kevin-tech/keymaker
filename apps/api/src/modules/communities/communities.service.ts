import { prisma } from "../../db/prisma.js";
import type { CreateCommunityBody } from "./communities.types.js";

export async function list() {
  return prisma.community.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getBySlug(slug: string) {
  return prisma.community.findUnique({
    where: { slug },
  });
}

export async function create(body: CreateCommunityBody) {
  const slug = body.slug.toLowerCase().trim().replace(/\s+/g, "-");
  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("Community with this slug already exists");
  }
  return prisma.community.create({
    data: {
      name: body.name.trim(),
      slug,
      weightClarity: body.weightClarity ?? 1,
      weightEvidence: body.weightEvidence ?? 1,
      weightKindness: body.weightKindness ?? 1,
      weightNovelty: body.weightNovelty ?? 1,
      decayHalfLifeSeconds: body.decayHalfLifeSeconds ?? 86400,
    },
  });
}
