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
