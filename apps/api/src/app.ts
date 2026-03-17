import express, { type Express } from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { apiRouter } from "./routes/index.js";

const app: Express = express();
app.use(cors());
app.use(express.json());
app.use(authMiddleware);
app.use("/api", apiRouter);
app.use(errorMiddleware);

export default app;
