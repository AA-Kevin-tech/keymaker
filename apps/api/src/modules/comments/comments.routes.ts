import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createCommentSchema } from "./comments.schema.js";
import * as commentsController from "./comments.controller.js";

export const commentsRoutes = Router();
commentsRoutes.post("/", requireAuth, validateZod(createCommentSchema), commentsController.create);
commentsRoutes.get("/by-post/:postId", commentsController.listByPostId);
