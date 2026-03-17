import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createCommunitySchema, updateCommunitySettingsSchema } from "./communities.schema.js";
import * as communitiesController from "./communities.controller.js";
import * as rankingController from "../ranking/ranking.controller.js";

export const communitiesRoutes: IRouter = Router();
communitiesRoutes.get("/", communitiesController.list);
communitiesRoutes.get("/:slug/feed", rankingController.getFeed);
communitiesRoutes.get("/:slug", communitiesController.getBySlug);
communitiesRoutes.patch("/:slug", requireAuth, validateZod(updateCommunitySettingsSchema), communitiesController.updateSettings);
communitiesRoutes.post("/", requireAuth, validateZod(createCommunitySchema), communitiesController.create);
