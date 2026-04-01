import type { Request, Response } from "express";
import * as usersService from "./users.service.js";

export async function getByUsername(req: Request, res: Response): Promise<void> {
  const { username } = req.params;
  if (!username) {
    res.status(400).json({ error: "username required" });
    return;
  }
  const user = await usersService.getByUsername(username);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    reputationClarity: user.reputationClarity,
    reputationEvidence: user.reputationEvidence,
    reputationNovelty: user.reputationNovelty,
  });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: "id required" });
    return;
  }
  const user = await usersService.getById(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    reputationClarity: user.reputationClarity,
    reputationEvidence: user.reputationEvidence,
    reputationNovelty: user.reputationNovelty,
  });
}
