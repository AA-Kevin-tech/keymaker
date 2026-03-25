import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as moderationController from "./moderation.controller.js";

/**
 * Read-only moderation log routes. Creating `moderation_actions` is only supported via
 * authenticated admin flows (`/api/admin/...`, report resolution, etc.) using `moderation-audit.service`.
 */
export const moderationRoutes: IRouter = Router();

moderationRoutes.get(
  "/by-community/:communityId",
  requireAuth,
  moderationController.listByCommunity
);
moderationRoutes.get(
  "/by-target/:targetType/:targetId",
  requireAuth,
  moderationController.listByTarget
);
