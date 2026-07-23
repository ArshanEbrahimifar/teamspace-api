import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.middleware.js";

import { listCurrentUserInvitationsHandler } from "./invitation.controller.js";

export const invitationRouter = Router();

invitationRouter.get("/", authenticate, listCurrentUserInvitationsHandler);
