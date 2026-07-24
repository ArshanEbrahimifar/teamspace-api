import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.middleware.js";

import {
  acceptWorkspaceInvitationHandler,
  listCurrentUserInvitationsHandler,
} from "./invitation.controller.js";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { acceptWorkspaceInvitationSchema } from "./invitation.schema.js";

export const invitationRouter = Router();

invitationRouter.get("/", authenticate, listCurrentUserInvitationsHandler);

invitationRouter.post(
  "/accept",
  authenticate,
  validateRequest(acceptWorkspaceInvitationSchema),
  acceptWorkspaceInvitationHandler,
);
