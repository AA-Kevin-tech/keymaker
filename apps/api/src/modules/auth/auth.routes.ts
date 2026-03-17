import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as authController from "./auth.controller.js";

export const authRoutes = Router();
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.get("/me", requireAuth, authController.getMe);
