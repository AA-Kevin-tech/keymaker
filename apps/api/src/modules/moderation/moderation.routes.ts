import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as moderationController from "./moderation.controller.js";

export const moderationRoutes = Router();
moderationRoutes.post("/", requireAuth, moderationController.create);
moderationRoutes.get("/by-community/:communityId", moderationController.listByCommunity);
moderationRoutes.get("/by-target/:targetType/:targetId", moderationController.listByTarget);
