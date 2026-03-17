import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createPostSchema, updatePostSchema } from "./posts.schema.js";
import * as postsController from "./posts.controller.js";

export const postsRoutes: IRouter = Router();
postsRoutes.post("/", requireAuth, validateZod(createPostSchema), postsController.create);
postsRoutes.get("/:id", postsController.getById);
postsRoutes.patch("/:id", requireAuth, validateZod(updatePostSchema), postsController.update);
postsRoutes.post("/:id/hide", requireAuth, postsController.hide);
postsRoutes.post("/:id/restore", requireAuth, postsController.restorePost);
