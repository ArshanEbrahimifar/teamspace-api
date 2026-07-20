import type { RequestHandler } from "express";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateWorkspaceInput } from "./workspace.schema.js";
import { createWorkspace } from "./workspace.service.js";

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
