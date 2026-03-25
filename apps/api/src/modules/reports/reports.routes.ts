import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createReportBodySchema } from "./reports.schema.js";
import * as reportsController from "./reports.controller.js";

export const reportsRoutes: IRouter = Router();

reportsRoutes.post("/", requireAuth, validateZod(createReportBodySchema), reportsController.create);
