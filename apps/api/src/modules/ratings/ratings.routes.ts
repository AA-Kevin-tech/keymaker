import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { upsertRatingSchema } from "./ratings.schema.js";
import * as ratingsController from "./ratings.controller.js";

export const ratingsRoutes = Router();
ratingsRoutes.put("/", requireAuth, validateZod(upsertRatingSchema), ratingsController.upsert);
