import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  UpdateWorkspaceParams,
  WorkspaceIdParams,
} from "./workspace.schema.js";
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
} from "./workspace.service.js";

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
  const { params } = res.locals.validatedData as { params: WorkspaceIdParams };
  const result = await getWorkspaceById(params.workspaceId, req.auth.user.id);

  res.status(200).json({
    success: true,
    message: "Workspace retrieved successfully",
    data: result,
  });
};
export const updateWorkspaceHandler: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }
  const { params, body } = res.locals.validatedData as {
    params: UpdateWorkspaceParams;
    body: UpdateWorkspaceInput;
  };

  const result = await updateWorkspace(
    params.workspaceId,
    req.auth.user.id,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Workspace updated successfully",
    data: result,
  });
};
