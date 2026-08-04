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
  deleteTaskSchema,
  getTaskSchema,
  listColumnTasksSchema,
  moveTaskSchema,
  reorderColumnTasksSchema,
  updateTaskSchema,
} from "../task/task.schema.js";
import {
  createTaskHandler,
  deleteTaskHandler,
  getTaskHandler,
  listColumnTasksHandler,
  moveTaskHandler,
  reorderColumnTasksHandler,
  updateTaskHandler,
} from "../task/task.controller.js";
import { listWorkspaceActivitiesSchema } from "../activity/activity.schema.js";
import { listWorkspaceActivitiesHandler } from "../activity/activity.controller.js";

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

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}:
 *   get:
 *     tags:
 *       - Workspaces
 *     summary: Get a workspace by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workspace returned successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not a workspace member
 *       404:
 *         description: Workspace not found
 */
workspaceRouter.get(
  "/:workspaceId",
  authenticate,
  validateRequest(workspaceIdParamsSchema),
  authorizeWorkspaceRoles("ADMIN", "OWNER", "MEMBER"),
  getWorkspaceHandler,
);

/**
 * @openapi
 * /api/v1/workspaces:
 *   post:
 *     tags:
 *       - Workspaces
 *     summary: Create a new workspace
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Development Team
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 */
workspaceRouter.post(
  "/",
  authenticate,
  validateRequest(createWorkspaceSchema),
  createWorkspaceHandler,
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}:
 *   patch:
 *     tags:
 *       - Workspaces
 *     summary: Update a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Workspace
 *     responses:
 *       200:
 *         description: Workspace updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient workspace permissions
 *       404:
 *         description: Workspace not found
 */
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

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/invitations:
 *   post:
 *     tags:
 *       - Invitations
 *     summary: Invite a user to a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: member@example.com
 *               role:
 *                 type: string
 *                 enum:
 *                   - ADMIN
 *                   - MEMBER
 *                 example: MEMBER
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient workspace permissions
 *       409:
 *         description: Invitation or membership already exists
 */
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

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - key
 *             properties:
 *               name:
 *                 type: string
 *                 example: Teamspace API
 *               key:
 *                 type: string
 *                 example: TSA
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient workspace permissions
 *       409:
 *         description: Project key already exists
 */
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

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/projects/{projectId}/boards:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Create a board in a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Development Board
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Main board for development tasks
 *     responses:
 *       201:
 *         description: Board created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient workspace permissions
 *       404:
 *         description: Workspace or project not found
 */
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

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/projects/{projectId}/boards/{boardId}/columns/{columnId}/tasks:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Create a task in a board column
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Add Swagger documentation
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient workspace permissions
 *       404:
 *         description: Project, board, or column not found
 */
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
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks/reorder",
  authenticate,
  validateRequest(reorderColumnTasksSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  reorderColumnTasksHandler,
);

workspaceRouter.patch(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authenticate,
  validateRequest(updateTaskSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  updateTaskHandler,
);
workspaceRouter.delete(
  "/:workspaceId/projects/:projectId/boards/:boardId/columns/:columnId/tasks/:taskId",
  authenticate,
  validateRequest(deleteTaskSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  deleteTaskHandler,
);
/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/projects/{projectId}/boards/{boardId}/tasks/{taskId}/move:
 *   patch:
 *     tags:
 *       - Tasks
 *     summary: Move a task to another position or column
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetColumnId
 *               - targetPosition
 *             properties:
 *               targetColumnId:
 *                 type: string
 *                 format: uuid
 *               targetPosition:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *     responses:
 *       200:
 *         description: Task moved successfully
 *       400:
 *         description: Invalid move request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient workspace permissions
 *       404:
 *         description: Task or target column not found
 */
workspaceRouter.patch(
  "/:workspaceId/projects/:projectId/boards/:boardId/tasks/:taskId/move",
  authenticate,
  validateRequest(moveTaskSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  moveTaskHandler,
);

/**
 * @openapi
 * /api/v1/workspaces/{workspaceId}/activities:
 *   get:
 *     tags:
 *       - Activities
 *     summary: Get workspace activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum:
 *             - WORKSPACE_CREATED
 *             - MEMBER_INVITED
 *             - PROJECT_CREATED
 *             - BOARD_CREATED
 *             - COLUMN_CREATED
 *             - TASK_CREATED
 *             - TASK_UPDATED
 *             - TASK_MOVED
 *             - TASK_DELETED
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum:
 *             - WORKSPACE
 *             - WORKSPACE_INVITATION
 *             - PROJECT
 *             - BOARD
 *             - BOARD_COLUMN
 *             - TASK
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Activity logs returned successfully
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not a workspace member
 *       404:
 *         description: Workspace not found
 */
workspaceRouter.get(
  "/:workspaceId/activities",
  authenticate,
  validateRequest(listWorkspaceActivitiesSchema),
  authorizeWorkspaceRoles("OWNER", "ADMIN", "MEMBER"),
  listWorkspaceActivitiesHandler,
);
