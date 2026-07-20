import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { createWorkspaceSchema } from "./workspace.schema.js";
import { createWorkspaceHandler } from "./workspace.controller.js";

export const workspaceRouter = Router();

workspaceRouter.post(
  "/",
  authenticate,
  validateRequest(createWorkspaceSchema),
  createWorkspaceHandler,
);
