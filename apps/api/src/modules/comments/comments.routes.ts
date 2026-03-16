import { Router } from "express";
import * as commentsController from "./comments.controller.js";

export const commentsRoutes = Router();
commentsRoutes.post("/", commentsController.create);
commentsRoutes.get("/by-post/:postId", commentsController.listByPostId);
