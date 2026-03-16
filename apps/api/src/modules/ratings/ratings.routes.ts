import { Router } from "express";
import * as ratingsController from "./ratings.controller.js";

export const ratingsRoutes = Router();
ratingsRoutes.put("/", ratingsController.upsert);
