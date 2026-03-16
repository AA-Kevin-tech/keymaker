import { Router } from "express";
import * as postsController from "./posts.controller.js";

export const postsRoutes = Router();
postsRoutes.post("/", postsController.create);
postsRoutes.get("/:id", postsController.getById);
postsRoutes.patch("/:id", postsController.update);
