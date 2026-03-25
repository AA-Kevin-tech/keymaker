import type { NextFunction, Request, Response } from "express";
import * as adminUsersService from "./admin-users.service.js";
import * as userRestrictionsService from "../user-restrictions/user-restrictions.service.js";
import * as moderatorNotesService from "../moderator-notes/moderator-notes.service.js";
import type { AdminUserListQueryInput } from "./admin-users.schema.js";

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const result = await adminUsersService.listAdminUsers(
      req.user.id,
      req.query as unknown as AdminUserListQueryInput
    );
    res.json(result);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

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

export async function listRestrictions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const restrictions = await userRestrictionsService.listRestrictionsForAdminView(
      req.user.id,
      req.params.id
    );
    res.json(restrictions);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function restrictUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const row = await userRestrictionsService.createRestrictionFromAdmin(req.user.id, req.params.id, req.body);
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

export async function unrestrictUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const updated = await userRestrictionsService.unrestrictUserFromAdmin(req.user.id, req.params.id, req.body);
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

export async function listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const notes = await moderatorNotesService.listNotesForAdminUser(req.user.id, req.params.id);
    res.json({ notes });
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const note = await moderatorNotesService.addNoteFromAdmin(req.user.id, req.params.id, req.body);
    res.status(201).json(note);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function warnUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const result = await adminUsersService.warnUserFromAdmin(req.user.id, req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
