import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as commentsController from "./comments.controller.js";

export const commentsRoutes = Router();
commentsRoutes.post("/", requireAuth, commentsController.create);
commentsRoutes.get("/by-post/:postId", commentsController.listByPostId);
