import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as postsController from "./posts.controller.js";

export const postsRoutes = Router();
postsRoutes.post("/", requireAuth, postsController.create);
postsRoutes.get("/:id", postsController.getById);
postsRoutes.patch("/:id", postsController.update);
