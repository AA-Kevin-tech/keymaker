import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { usersRoutes } from "../modules/users/users.routes.js";
import { communitiesRoutes } from "../modules/communities/communities.routes.js";
import { postsRoutes } from "../modules/posts/posts.routes.js";
import { commentsRoutes } from "../modules/comments/comments.routes.js";
import { ratingsRoutes } from "../modules/ratings/ratings.routes.js";
import { moderationRoutes } from "../modules/moderation/moderation.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/communities", communitiesRoutes);
apiRouter.use("/posts", postsRoutes);
apiRouter.use("/comments", commentsRoutes);
apiRouter.use("/ratings", ratingsRoutes);
apiRouter.use("/moderation", moderationRoutes);
