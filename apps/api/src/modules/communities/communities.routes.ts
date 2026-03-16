import { Router } from "express";
import * as communitiesController from "./communities.controller.js";
import * as rankingController from "../ranking/ranking.controller.js";

export const communitiesRoutes = Router();
communitiesRoutes.get("/", communitiesController.list);
communitiesRoutes.get("/:slug/feed", rankingController.getFeed);
communitiesRoutes.get("/:slug", communitiesController.getBySlug);
communitiesRoutes.post("/", communitiesController.create);
