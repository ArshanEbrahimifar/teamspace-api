import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import {
  createWorkspaceInvitationSchema,
  createWorkspaceSchema,
  removeWorkspaceMemberSchema,
  updateWorkspaceMemberRoleSchema,
  updateWorkspaceSchema,
  workspaceIdParamsSchema,
} from "./workspace.schema.js";
import {
  createWorkspaceHandler,
  createWorkspaceInvitationHandler,
  deleteWorkspaceHandler,
  getWorkspaceHandler,
  listWorkspaceInvitationsHandler,
  listWorkspaceMembersHandler,
  listWorkspacesHandler,
  removeWorkspaceMemberHandler,
  updateWorkspaceHandler,
  updateWorkspaceMemberRoleHandler,
} from "./workspace.controller.js";
import { authorizeWorkspaceRoles } from "../../middleware/authorize-workspace.middleware.js";

export const workspaceRouter = Router();

workspaceRouter.get("/", authenticate, listWorkspacesHandler);

workspaceRouter.get(
  "/:workspaceId/members",
  authenticate,
  validateRequest(workspaceIdParamsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listWorkspaceMembersHandler,
);

workspaceRouter.patch(
  "/:workspaceId/members/:memberId/role",
  authenticate,
  validateRequest(updateWorkspaceMemberRoleSchema),
  authorizeWorkspaceRoles("OWNER"),
  updateWorkspaceMemberRoleHandler,
);

workspaceRouter.delete(
  "/:workspaceId/members/:memberId",
  authenticate,
  validateRequest(removeWorkspaceMemberSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  removeWorkspaceMemberHandler,
);

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
workspaceRouter.get(
  "/:workspaceId/invitations",
  authenticate,
  validateRequest(workspaceIdParamsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  listWorkspaceInvitationsHandler,
);
workspaceRouter.post(
  "/:workspaceId/invitations",
  authenticate,
  validateRequest(createWorkspaceInvitationSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  createWorkspaceInvitationHandler,
);
