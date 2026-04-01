import { HttpError } from "../../lib/http-error.js";
import { prisma } from "../../db/prisma.js";
import {
  assertUserMayCreateCommunity,
  assertUserMayUpdateCommunitySettings,
} from "../user-restrictions/restriction-enforcement.service.js";
import type { CreateCommunityBody } from "./communities.types.js";
import type { UpdateCommunitySettingsInput } from "./communities.schema.js";

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

export async function create(body: CreateCommunityBody, creatorUserId: string) {
  await assertUserMayCreateCommunity(creatorUserId);
  const slug = body.slug.toLowerCase().trim().replace(/\s+/g, "-");
  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) {
    throw new HttpError(409, "Community with this slug already exists");
  }
  return prisma.community.create({
    data: {
      name: body.name.trim(),
      slug,
      weightClarity: body.weightClarity ?? 1,
      weightEvidence: body.weightEvidence ?? 1,
      weightNovelty: body.weightNovelty ?? 1,
      decayHalfLifeSeconds: body.decayHalfLifeSeconds ?? 86400,
    },
  });
}

export async function updateSettings(
  slug: string,
  body: UpdateCommunitySettingsInput,
  actingUserId: string
) {
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return null;
  await assertUserMayUpdateCommunitySettings(actingUserId, community.id);
  const data: Record<string, number> = {};
  if (body.weightClarity !== undefined) data.weightClarity = body.weightClarity;
  if (body.weightEvidence !== undefined) data.weightEvidence = body.weightEvidence;
  if (body.weightNovelty !== undefined) data.weightNovelty = body.weightNovelty;
  if (body.decayHalfLifeSeconds !== undefined) data.decayHalfLifeSeconds = body.decayHalfLifeSeconds;
  if (Object.keys(data).length === 0) return community;
  return prisma.community.update({
    where: { id: community.id },
    data,
  });
}
