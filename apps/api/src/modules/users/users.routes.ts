import { Router } from "express";
import * as usersController from "./users.controller.js";

export const usersRoutes = Router();
usersRoutes.get("/by-id/:id", usersController.getById);
usersRoutes.get("/:username", usersController.getByUsername);
