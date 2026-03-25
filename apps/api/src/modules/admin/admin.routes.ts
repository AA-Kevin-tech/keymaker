import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireAdminAccess } from "../../middleware/requireAdminAccess.js";
import { validateZod } from "../../middleware/validateZod.js";
import { validateZodQuery } from "../../middleware/validateZodQuery.js";
import {
  adminAppealListQuerySchema,
  appealDecisionBodySchema,
  appealModifyBodySchema,
  appealReverseBodySchema,
} from "../appeals/appeals.schema.js";
import {
  adminContentReasonBodySchema,
  adminReportListQuerySchema,
  dismissReportBodySchema,
  reportActionBodySchema,
} from "../reports/reports.schema.js";
import {
  addModeratorNoteBodySchema,
} from "../moderator-notes/moderator-notes.schema.js";
import { restrictUserBodySchema, unrestrictUserBodySchema } from "../user-restrictions/user-restrictions.schema.js";
import * as adminContentReviewController from "./admin-content-review.controller.js";
import * as adminController from "./admin.controller.js";
import * as adminPurgeController from "./admin-purge.controller.js";
import * as adminReportsController from "./admin-reports.controller.js";
import * as adminUsersController from "./admin-users.controller.js";
import * as adminAppealsController from "./admin-appeals.controller.js";
import { adminUserListQuerySchema, adminWarnUserBodySchema } from "./admin-users.schema.js";

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

adminRoutes.post("/posts/:id/purge", adminPurgeController.purgePost);
adminRoutes.post("/comments/:id/purge", adminPurgeController.purgeComment);

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

adminRoutes.get(
  "/users",
  validateZodQuery(adminUserListQuerySchema),
  adminUsersController.listUsers
);
adminRoutes.get("/users/:id", adminUsersController.getById);
adminRoutes.get("/users/:id/restrictions", adminUsersController.listRestrictions);
adminRoutes.post(
  "/users/:id/restrict",
  validateZod(restrictUserBodySchema),
  adminUsersController.restrictUser
);
adminRoutes.post(
  "/users/:id/unrestrict",
  validateZod(unrestrictUserBodySchema),
  adminUsersController.unrestrictUser
);
adminRoutes.get("/users/:id/notes", adminUsersController.listNotes);
adminRoutes.post(
  "/users/:id/add-note",
  validateZod(addModeratorNoteBodySchema),
  adminUsersController.addNote
);
adminRoutes.post(
  "/users/:id/warn",
  validateZod(adminWarnUserBodySchema),
  adminUsersController.warnUser
);

adminRoutes.get(
  "/appeals",
  validateZodQuery(adminAppealListQuerySchema),
  adminAppealsController.listAppeals
);
adminRoutes.get("/appeals/:id", adminAppealsController.getById);
adminRoutes.post(
  "/appeals/:id/uphold",
  validateZod(appealDecisionBodySchema),
  adminAppealsController.uphold
);
adminRoutes.post(
  "/appeals/:id/reverse",
  validateZod(appealReverseBodySchema),
  adminAppealsController.reverse
);
adminRoutes.post(
  "/appeals/:id/modify",
  validateZod(appealModifyBodySchema),
  adminAppealsController.modify
);

adminRoutes.get("/communities", adminController.notImplemented);
adminRoutes.get("/communities/:id", adminController.notImplemented);
adminRoutes.get("/mod-log", adminController.notImplemented);
adminRoutes.get("/ratings/targets/:targetType/:targetId", adminController.notImplemented);
adminRoutes.get("/ratings/suspicious", adminController.notImplemented);
