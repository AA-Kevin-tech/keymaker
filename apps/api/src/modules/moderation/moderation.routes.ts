import { Router } from "express";
import * as moderationController from "./moderation.controller.js";

export const moderationRoutes = Router();
moderationRoutes.post("/", moderationController.create);
moderationRoutes.get("/by-community/:communityId", moderationController.listByCommunity);
moderationRoutes.get("/by-target/:targetType/:targetId", moderationController.listByTarget);
