import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.middleware.js";

import {
  acceptWorkspaceInvitationHandler,
  declineWorkspaceInvitationHandler,
  listCurrentUserInvitationsHandler,
} from "./invitation.controller.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import {
  acceptWorkspaceInvitationSchema,
  declineWorkspaceInvitationSchema,
} from "./invitation.schema.js";

export const invitationRouter = Router();

invitationRouter.get("/", authenticate, listCurrentUserInvitationsHandler);

/**
 * @openapi
 * /api/v1/invitations/accept:
 *   post:
 *     tags:
 *       - Invitations
 *     summary: Accept a workspace invitation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: invitation-token
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 *       400:
 *         description: Invitation is expired or invalid
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Invitation belongs to another email
 *       404:
 *         description: Invitation not found
 *       409:
 *         description: Invitation was already processed
 */
invitationRouter.post(
  "/accept",
  authenticate,
  validateRequest(acceptWorkspaceInvitationSchema),
  acceptWorkspaceInvitationHandler,
);
invitationRouter.post(
  "/decline",
  authenticate,
  validateRequest(declineWorkspaceInvitationSchema),
  declineWorkspaceInvitationHandler,
);
