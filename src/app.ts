import cors from "cors";
import express from "express";
import helmet from "helmet";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Teamsapce API is running",
  });
});

app.use("/api/v1/auth", authRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
