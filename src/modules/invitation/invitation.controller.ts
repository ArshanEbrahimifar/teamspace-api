import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import { getCurrentUserInvitations } from "./invitation.service.js";

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
