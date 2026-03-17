import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createCommentSchema } from "./comments.schema.js";
import * as commentsController from "./comments.controller.js";

export const commentsRoutes: IRouter = Router();
commentsRoutes.post("/", requireAuth, validateZod(createCommentSchema), commentsController.create);
commentsRoutes.get("/by-post/:postId", commentsController.listByPostId);
commentsRoutes.post("/:id/hide", requireAuth, commentsController.hide);
commentsRoutes.post("/:id/restore", requireAuth, commentsController.restoreComment);
