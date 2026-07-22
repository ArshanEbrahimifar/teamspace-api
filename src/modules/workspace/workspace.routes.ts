import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdParamsSchema,
} from "./workspace.schema.js";
import {
  createWorkspaceHandler,
  deleteWorkspaceHandler,
  getWorkspaceHandler,
  listWorkspacesHandler,
  updateWorkspaceHandler,
} from "./workspace.controller.js";
import { authorizeWorkspaceRoles } from "../../middleware/authorize-workspace.middleware.js";

export const workspaceRouter = Router();

workspaceRouter.get("/", authenticate, listWorkspacesHandler);

workspaceRouter.get(
  "/:workspaceId",
  authenticate,
  validateRequest(workspaceIdParamsSchema),
  authorizeWorkspaceRoles("ADMIN", "OWNER", "MEMBER"),
  getWorkspaceHandler,
);

workspaceRouter.post(
  "/",
  authenticate,
  validateRequest(createWorkspaceSchema),
  createWorkspaceHandler,
);

workspaceRouter.patch(
  "/:workspaceId",
  authenticate,
  validateRequest(updateWorkspaceSchema),
  authorizeWorkspaceRoles("ADMIN", "OWNER"),
  updateWorkspaceHandler,
);
workspaceRouter.delete(
  "/:workspaceId",
  authenticate,
  validateRequest(workspaceIdParamsSchema),
  authorizeWorkspaceRoles("OWNER"),
  deleteWorkspaceHandler,
);
