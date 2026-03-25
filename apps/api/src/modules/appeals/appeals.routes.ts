import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createAppealBodySchema } from "./appeals.schema.js";
import * as appealsController from "./appeals.controller.js";

export const appealsRoutes: IRouter = Router();

appealsRoutes.post("/", requireAuth, validateZod(createAppealBodySchema), appealsController.createAppeal);
