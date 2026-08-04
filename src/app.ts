import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { workspaceRouter } from "./modules/workspace/workspace.routes.js";
import { invitationRouter } from "./modules/invitation/invitation.routes.js";
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Teamsapce API is running",
  });
});

app.use("/api/v1/auth", authRouter);

app.use("/api/v1/workspaces", workspaceRouter);

app.use("/api/v1/invitations", invitationRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
