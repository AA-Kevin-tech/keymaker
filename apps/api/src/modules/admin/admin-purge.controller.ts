import type { NextFunction, Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import * as adminAuth from "./admin-authorization.service.js";
import * as commentsService from "../comments/comments.service.js";
import * as postsService from "../posts/posts.service.js";

/**
 * Irreversible data removal for legal / GDPR / severe abuse cases.
 * Restricted to platform staff only (`super_admin`, `platform_moderator`).
 * Typical moderation should use soft delete + restore under `/api/admin/posts|comments/.../remove|restore`.
 */
export async function purgePost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!(await adminAuth.isPlatformStaff(req.user.id))) {
      res.status(403).json({ error: "Permanent purge requires platform moderator access" });
      return;
    }
    const post = await prisma.post.findFirst({ where: { id: req.params.id }, select: { id: true } });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    await postsService.purgePostPermanently(post.id);
    res.status(204).send();
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function purgeComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!(await adminAuth.isPlatformStaff(req.user.id))) {
      res.status(403).json({ error: "Permanent purge requires platform moderator access" });
      return;
    }
    const comment = await prisma.comment.findFirst({
      where: { id: req.params.id },
      select: { id: true },
    });
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    await commentsService.purgeCommentPermanently(comment.id);
    res.status(204).send();
  } catch (err) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
}
