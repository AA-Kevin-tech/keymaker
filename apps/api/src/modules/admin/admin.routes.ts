import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireAdminAccess } from "../../middleware/requireAdminAccess.js";
import { validateZod } from "../../middleware/validateZod.js";
import { validateZodQuery } from "../../middleware/validateZodQuery.js";
import {
  adminContentReasonBodySchema,
  adminReportListQuerySchema,
  dismissReportBodySchema,
  reportActionBodySchema,
} from "../reports/reports.schema.js";
import * as adminContentReviewController from "./admin-content-review.controller.js";
import * as adminController from "./admin.controller.js";
import * as adminReportsController from "./admin-reports.controller.js";

export const adminRoutes: IRouter = Router();

adminRoutes.use(requireAuth, requireAdminAccess);

adminRoutes.get("/dashboard", adminController.dashboard);

adminRoutes.get(
  "/reports",
  validateZodQuery(adminReportListQuerySchema),
  adminReportsController.list
);
adminRoutes.get("/reports/:id", adminReportsController.getById);
adminRoutes.post(
  "/reports/:id/dismiss",
  validateZod(dismissReportBodySchema),
  adminReportsController.dismiss
);
adminRoutes.post(
  "/reports/:id/action",
  validateZod(reportActionBodySchema),
  adminReportsController.action
);

adminRoutes.get("/posts/:id/review", adminContentReviewController.getPostReview);
adminRoutes.post(
  "/posts/:id/remove",
  validateZod(adminContentReasonBodySchema),
  adminContentReviewController.removePost
);
adminRoutes.post(
  "/posts/:id/restore",
  validateZod(adminContentReasonBodySchema),
  adminContentReviewController.restorePost
);

adminRoutes.get("/comments/:id/review", adminContentReviewController.getCommentReview);
adminRoutes.post(
  "/comments/:id/remove",
  validateZod(adminContentReasonBodySchema),
  adminContentReviewController.removeComment
);
adminRoutes.post(
  "/comments/:id/restore",
  validateZod(adminContentReasonBodySchema),
  adminContentReviewController.restoreComment
);

// Stubs for upcoming REST surface
adminRoutes.get("/appeals", adminController.notImplemented);
adminRoutes.get("/appeals/:id", adminController.notImplemented);
adminRoutes.get("/users", adminController.notImplemented);
adminRoutes.get("/users/:id", adminController.notImplemented);
adminRoutes.get("/communities", adminController.notImplemented);
adminRoutes.get("/communities/:id", adminController.notImplemented);
adminRoutes.get("/mod-log", adminController.notImplemented);
adminRoutes.get("/ratings/targets/:targetType/:targetId", adminController.notImplemented);
adminRoutes.get("/ratings/suspicious", adminController.notImplemented);
