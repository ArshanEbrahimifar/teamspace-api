import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type { CreateProjectInput } from "./project.schema.js";
import { createProject } from "./project.service.js";

export const createProjectHandler: RequestHandler = async (req, res) => {
  if (!req.auth || !req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { body } = res.locals.validatedData as {
    body: CreateProjectInput;
  };

  const project = await createProject(
    req.workspaceContext.workspace.id,
    req.auth.user.id,
    body,
  );

  res.status(201).json({
    success: true,
    message: "Project created successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project,
    },
  });
};
