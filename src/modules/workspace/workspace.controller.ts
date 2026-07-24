import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceInvitationInput,
  RemoveWorkspaceMemberParams,
  RevokeWorkspaceInvitationParams,
  TransferWorkspaceOwnershipInput,
  UpdateWorkspaceInput,
  UpdateWorkspaceMemberRoleInput,
  UpdateWorkspaceMemberRoleParams,
} from "./workspace.schema.js";
import {
  createWorkspace,
  createWorkspaceInvitation,
  getUserWorkspaces,
  getWorkspaceInvitations,
  getWorkspaceMembers,
  removeWorkspaceMember,
  revokeWorkspaceInvitation,
  softDeleteWorkspace,
  transferWorkspaceOwnership,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from "./workspace.service.js";
import { env } from "../../config/env.js";

export const createWorkspaceHandler: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }
  const { body } = res.locals.validatedData as { body: CreateWorkspaceInput };
  const result = await createWorkspace(body, req.auth.user.id);

  res.status(201).json({
    success: true,
    message: "Workspace created successfuly",
    data: result,
  });
};

export const listWorkspacesHandler: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }
  const workspaces = await getUserWorkspaces(req.auth.user.id);

  res.status(200).json({
    success: true,
    message: "Workspace retrieved successfully",
    data: {
      workspaces,
    },
  });
};
export const getWorkspaceHandler: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }
  res.status(200).json({
    success: true,
    message: "Workspace retrieved successfully",
    data: req.workspaceContext,
  });
};
export const updateWorkspaceHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { body } = res.locals.validatedData as {
    body: UpdateWorkspaceInput;
  };

  const updatedWorkspace = await updateWorkspace(
    req.workspaceContext.workspace.id,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Workspace updated successfully",
    data: {
      workspace: {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
        description: updatedWorkspace.description,
        logoUrl: updatedWorkspace.logoUrl,
        createdAt: updatedWorkspace.createdAt,
        updatedAt: updatedWorkspace.updatedAt,
        memberCount: updatedWorkspace._count.members,
      },

      membership: req.workspaceContext.membership,
    },
  });
};
export const deleteWorkspaceHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }
  await softDeleteWorkspace(req.workspaceContext.workspace.id);

  res.status(204).send();
};
export const listWorkspaceMembersHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const members = await getWorkspaceMembers(req.workspaceContext.workspace.id);

  res.status(200).json({
    success: true,
    message: "Workspace members retrieved successfully",
    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
        memberCount: req.workspaceContext.workspace.memberCount,
      },

      members,
    },
  });
};
export const updateWorkspaceMemberRoleHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: UpdateWorkspaceMemberRoleParams;
    body: UpdateWorkspaceMemberRoleInput;
  };

  const member = await updateWorkspaceMemberRole(
    req.workspaceContext.workspace.id,
    params.memberId,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Workspace member role updated successfully",
    data: {
      member,
    },
  });
};
export const removeWorkspaceMemberHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: RemoveWorkspaceMemberParams;
  };

  await removeWorkspaceMember(
    req.workspaceContext.workspace.id,
    params.memberId,
    req.workspaceContext.membership.role,
  );

  res.status(204).send();
};
export const createWorkspaceInvitationHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.auth || !req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { body } = res.locals.validatedData as {
    body: CreateWorkspaceInvitationInput;
  };

  const result = await createWorkspaceInvitation(
    req.workspaceContext.workspace.id,
    req.auth.user.id,
    body,
  );

  res.status(result.wasReissued ? 200 : 201).json({
    success: true,

    message: result.wasReissued
      ? "Workspace invitation reissued successfully"
      : "Workspace invitation created successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      invitation: result.invitation,

      ...(env.NODE_ENV === "development"
        ? {
            invitationToken: result.invitationToken,
          }
        : {}),
    },
  });
};
export const listWorkspaceInvitationsHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const invitations = await getWorkspaceInvitations(
    req.workspaceContext.workspace.id,
  );

  res.status(200).json({
    success: true,
    message: "Workspace invitations retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      invitations,
    },
  });
};
export const revokeWorkspaceInvitationHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: RevokeWorkspaceInvitationParams;
  };

  await revokeWorkspaceInvitation(
    req.workspaceContext.workspace.id,
    params.invitationId,
  );

  res.status(204).send();
};
export const transferWorkspaceOwnershipHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { body } = res.locals.validatedData as {
    body: TransferWorkspaceOwnershipInput;
  };

  const result = await transferWorkspaceOwnership(
    req.workspaceContext.workspace.id,
    req.workspaceContext.membership.id,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Workspace ownership transferred successfully",
    data: result,
  });
};
