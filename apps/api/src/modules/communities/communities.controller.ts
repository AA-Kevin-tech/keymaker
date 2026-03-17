import type { Request, Response } from "express";
import * as communitiesService from "./communities.service.js";
import { validateCreateCommunityBody } from "./communities.schema.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const communities = await communitiesService.list();
  res.json({ communities });
}

export async function getBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params;
  const community = await communitiesService.getBySlug(slug);
  if (!community) {
    res.status(404).json({ error: "Community not found" });
    return;
  }
  res.json({
    id: community.id,
    name: community.name,
    slug: community.slug,
    weightClarity: community.weightClarity,
    weightEvidence: community.weightEvidence,
    weightKindness: community.weightKindness,
    weightNovelty: community.weightNovelty,
    decayHalfLifeSeconds: community.decayHalfLifeSeconds,
    createdAt: community.createdAt.toISOString(),
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const result = validateCreateCommunityBody(req.body);
  if (!result.valid) {
    res.status(400).json({ error: result.message });
    return;
  }
  try {
    const community = await communitiesService.create(req.body);
    res.status(201).json({
      id: community.id,
      name: community.name,
      slug: community.slug,
      weightClarity: community.weightClarity,
      weightEvidence: community.weightEvidence,
      weightKindness: community.weightKindness,
      weightNovelty: community.weightNovelty,
      decayHalfLifeSeconds: community.decayHalfLifeSeconds,
      createdAt: community.createdAt.toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    res.status(400).json({ error: message });
  }
}
