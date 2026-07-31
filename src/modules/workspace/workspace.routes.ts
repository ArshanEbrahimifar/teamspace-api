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
  deleteBoardSchema,
  getBoardSchema,
  listProjectBoardsSchema,
  updateBoardSchema,
} from "../board/board.schema.js";
import {
  createBoardHandler,
  deleteBoardHandler,
  getBoardHandler,
  listProjectBoardsHandler,
  updateBoardHandler,
} from "../board/board.controller.js";
import {
  createBoardColumnSchema,
  deleteBoardColumnSchema,
  getBoardColumnSchema,
  listBoardColumnsSchema,
  reorderBoardColumnsSchema,
  updateBoardColumnSchema,
} from "../board-column/board-column.schema.js";
import {
  createBoardColumnHandler,
  deleteBoardColumnHandler,
  getBoardColumnHandler,
  listBoardColumnsHandler,
  reorderBoardColumnsHandler,
  updateBoardColumnHandler,
} from "../board-column/board-column.controller.js";
import {
  createTaskSchema,
  getTaskSchema,
  listColumnTasksSchema,
  updateTaskSchema,
} from "../task/task.schema.js";
import {
  createTaskHandler,
  getTaskHandler,
  listColumnTasksHandler,
  updateTaskHandler,
} from "../task/task.controller.js";

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

workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards",
  authenticate,
  validateRequest(listProjectBoardsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listProjectBoardsHandler,
);

workspaceRouter.post(
  "/:workspaceId/projects/:projectId/boards",
  authenticate,
  validateRequest(createBoardSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  createBoardHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards/:boardId",
  authenticate,
  validateRequest(getBoardSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  getBoardHandler,
);
workspaceRouter.patch(
  "/:workspaceId/projects/:projectId/boards/:boardId",
  authenticate,
  validateRequest(updateBoardSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  updateBoardHandler,
);
workspaceRouter.delete(
  "/:workspaceId/projects/:projectId/boards/:boardId",
  authenticate,
  validateRequest(deleteBoardSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  deleteBoardHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns",
  authenticate,
  validateRequest(listBoardColumnsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listBoardColumnsHandler,
);

workspaceRouter.post(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns",
  authenticate,
  validateRequest(createBoardColumnSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  createBoardColumnHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId",
  authenticate,
  validateRequest(getBoardColumnSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  getBoardColumnHandler,
);

workspaceRouter.patch(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/reorder",
  authenticate,
  validateRequest(reorderBoardColumnsSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  reorderBoardColumnsHandler,
);

workspaceRouter.patch(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId",
  authenticate,
  validateRequest(updateBoardColumnSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  updateBoardColumnHandler,
);
workspaceRouter.delete(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId",
  authenticate,
  validateRequest(deleteBoardColumnSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN"),
  deleteBoardColumnHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks",
  authenticate,
  validateRequest(listColumnTasksSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listColumnTasksHandler,
);

workspaceRouter.post(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks",
  authenticate,
  validateRequest(createTaskSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  createTaskHandler,
);

workspaceRouter.get(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authenticate,
  validateRequest(getTaskSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  getTaskHandler,
);
workspaceRouter.patch(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authenticate,
  validateRequest(updateTaskSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  updateTaskHandler,
);
