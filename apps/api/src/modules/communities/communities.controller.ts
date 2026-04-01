import type { Request, Response } from "express";
import { respondIfHttpError } from "../../lib/respond-http-error.js";
import * as communitiesService from "./communities.service.js";

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
  try {
    const community = await communitiesService.create(req.body, req.user.id);
    res.status(201).json({
      id: community.id,
      name: community.name,
      slug: community.slug,
      weightClarity: community.weightClarity,
      weightEvidence: community.weightEvidence,
      weightNovelty: community.weightNovelty,
      decayHalfLifeSeconds: community.decayHalfLifeSeconds,
      createdAt: community.createdAt.toISOString(),
    });
  } catch (e) {
    if (respondIfHttpError(res, e)) return;
    const message = e instanceof Error ? e.message : "Create failed";
    res.status(400).json({ error: message });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { slug } = req.params;
  try {
    const community = await communitiesService.updateSettings(slug, req.body, req.user.id);
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
      weightNovelty: community.weightNovelty,
      decayHalfLifeSeconds: community.decayHalfLifeSeconds,
      createdAt: community.createdAt.toISOString(),
    });
  } catch (e) {
    if (respondIfHttpError(res, e)) return;
    const message = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ error: message });
  }
}
