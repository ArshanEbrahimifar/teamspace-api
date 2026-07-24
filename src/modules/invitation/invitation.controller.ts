import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import {
  acceptWorkspaceInvitation,
  getCurrentUserInvitations,
} from "./invitation.service.js";
import type { AcceptWorkspaceInvitationInput } from "./invitation.schema.js";

export const listCurrentUserInvitationsHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }

  const invitations = await getCurrentUserInvitations(req.auth.user.email);

  res.status(200).json({
    success: true,
    message: "User invitations retrieved successfully",

    data: {
      invitations,
    },
  });
};
export const acceptWorkspaceInvitationHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }

  const { body } = res.locals.validatedData as {
    body: AcceptWorkspaceInvitationInput;
  };

  const result = await acceptWorkspaceInvitation(
    req.auth.user.id,
    req.auth.user.email,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Workspace invitation accepted successfully",
    data: result,
  });
};
