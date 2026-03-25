import type { NextFunction, Request, Response } from "express";
import * as adminUsersService from "./admin-users.service.js";
import * as userRestrictionsService from "../user-restrictions/user-restrictions.service.js";

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const detail = await adminUsersService.getAdminUserDetail(req.user.id, req.params.id);
    res.json(detail);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function createRestriction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const row = await userRestrictionsService.createRestrictionFromAdmin(
      req.user.id,
      req.params.id,
      req.body
    );
    res.status(201).json({
      id: row.id,
      userId: row.userId,
      restrictionType: row.restrictionType,
      communityId: row.communityId,
      reasonCode: row.reasonCode,
      reasonText: row.reasonText,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt?.toISOString() ?? null,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function deactivateRestriction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const updated = await userRestrictionsService.deactivateRestriction(
      req.user.id,
      req.params.restrictionId,
      req.body
    );
    if (!updated) {
      res.status(404).json({ error: "Restriction not found" });
      return;
    }
    res.json({
      id: updated.id,
      userId: updated.userId,
      restrictionType: updated.restrictionType,
      communityId: updated.communityId,
      isActive: updated.isActive,
      deactivatedAt: updated.deactivatedAt?.toISOString() ?? null,
      deactivatedBy: updated.deactivatedBy,
    });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
