import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as ratingsController from "./ratings.controller.js";

export const ratingsRoutes = Router();
ratingsRoutes.put("/", requireAuth, ratingsController.upsert);
