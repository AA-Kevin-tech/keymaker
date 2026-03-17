import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import * as authController from "./auth.controller.js";

export const authRoutes = Router();
authRoutes.post("/register", validateZod(registerSchema), authController.register);
authRoutes.post("/login", validateZod(loginSchema), authController.login);
authRoutes.get("/me", requireAuth, authController.getMe);
