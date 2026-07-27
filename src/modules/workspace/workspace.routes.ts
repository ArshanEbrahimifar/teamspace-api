import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import {
  createWorkspaceInvitationSchema,
  createWorkspaceSchema,
  removeWorkspaceMemberSchema,
  revokeWorkspaceInvitationSchema,
  transferWorkspaceOwnershipSchema,
  updateWorkspaceMemberRoleSchema,
  updateWorkspaceSchema,
  workspaceIdParamsSchema,
} from "./workspace.schema.js";
import {
  createWorkspaceHandler,
  createWorkspaceInvitationHandler,
  deleteWorkspaceHandler,
  getWorkspaceHandler,
  leaveWorkspaceHandler,
  listWorkspaceInvitationsHandler,
  listWorkspaceMembersHandler,
  listWorkspacesHandler,
  removeWorkspaceMemberHandler,
  revokeWorkspaceInvitationHandler,
  transferWorkspaceOwnershipHandler,
  updateWorkspaceHandler,
  updateWorkspaceMemberRoleHandler,
} from "./workspace.controller.js";
import { authorizeWorkspaceRoles } from "../../middleware/authorize-workspace.middleware.js";
import {
  createProjectSchema,
  deleteProjectSchema,
  getProjectSchema,
  listWorkspaceProjectsSchema,
  updateProjectSchema,
} from "../project/project.schema.js";
import {
  createProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  listWorkspaceProjectsHandler,
  updateProjectHandler,
} from "../project/project.controller.js";
import {
  createBoardSchema,
  listProjectBoardsSchema,
} from "../board/board.schema.js";
import {
  createBoardHandler,
  listProjectBoardsHandler,
} from "../board/board.controller.js";

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
  "/:workspaceId/members/me",
  authenticate,
  validateRequest(workspaceIdParamsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  leaveWorkspaceHandler,
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
workspaceRouter.delete(
  "/:workspaceId/invitations/:invitationId",
  authenticate,
  validateRequest(revokeWorkspaceInvitationSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  revokeWorkspaceInvitationHandler,
);
workspaceRouter.patch(
  "/:workspaceId/ownership",
  authenticate,
  validateRequest(transferWorkspaceOwnershipSchema),
  authorizeWorkspaceRoles("OWNER"),
  transferWorkspaceOwnershipHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects",
  authenticate,
  validateRequest(listWorkspaceProjectsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listWorkspaceProjectsHandler,
);

workspaceRouter.post(
  "/:workspaceId/projects",
  authenticate,
  validateRequest(createProjectSchema),
  authorizeWorkspaceRoles("ADMIN", "OWNER"),
  createProjectHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects/:projectId",
  authenticate,
  validateRequest(getProjectSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  getProjectHandler,
);
workspaceRouter.patch(
  "/:workspaceId/projects/:projectId",
  authenticate,
  validateRequest(updateProjectSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  updateProjectHandler,
);
workspaceRouter.delete(
  "/:workspaceId/projects/:projectId",
  authenticate,
  validateRequest(deleteProjectSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  deleteProjectHandler,
);
workspaceRouter.post(
  "/:workspaceId/projects/:projectId/boards",
  authenticate,
  validateRequest(createBoardSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  createBoardHandler,
);
workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards",
  authenticate,
  validateRequest(listProjectBoardsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listProjectBoardsHandler,
);
