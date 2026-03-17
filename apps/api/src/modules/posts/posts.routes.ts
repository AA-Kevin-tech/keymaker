import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { createPostSchema, updatePostSchema } from "./posts.schema.js";
import * as postsController from "./posts.controller.js";

export const postsRoutes = Router();
postsRoutes.post("/", requireAuth, validateZod(createPostSchema), postsController.create);
postsRoutes.get("/:id", postsController.getById);
postsRoutes.patch("/:id", validateZod(updatePostSchema), postsController.update);
