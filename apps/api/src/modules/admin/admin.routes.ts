import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireAdminPlatform } from "../../middleware/requireAdminPlatform.js";
import * as adminController from "./admin.controller.js";

export const adminRoutes: IRouter = Router();

adminRoutes.use(requireAuth, requireAdminPlatform);

adminRoutes.get("/dashboard", adminController.dashboard);

// Stubs for upcoming REST surface (enforce auth early)
adminRoutes.get("/reports", adminController.notImplemented);
adminRoutes.get("/reports/:id", adminController.notImplemented);
adminRoutes.get("/appeals", adminController.notImplemented);
adminRoutes.get("/appeals/:id", adminController.notImplemented);
adminRoutes.get("/users", adminController.notImplemented);
adminRoutes.get("/users/:id", adminController.notImplemented);
adminRoutes.get("/communities", adminController.notImplemented);
adminRoutes.get("/communities/:id", adminController.notImplemented);
adminRoutes.get("/mod-log", adminController.notImplemented);
adminRoutes.get("/ratings/targets/:targetType/:targetId", adminController.notImplemented);
adminRoutes.get("/ratings/suspicious", adminController.notImplemented);
