import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateZod } from "../../middleware/validateZod.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "./auth.schema.js";
import * as authController from "./auth.controller.js";

export const authRoutes: IRouter = Router();
authRoutes.post("/register", validateZod(registerSchema), authController.register);
authRoutes.post("/login", validateZod(loginSchema), authController.login);
authRoutes.post("/verify-email", validateZod(verifyEmailSchema), authController.verifyEmail);
authRoutes.post("/resend-verification", validateZod(resendVerificationSchema), authController.resendVerification);
authRoutes.get("/me", requireAuth, authController.getMe);
