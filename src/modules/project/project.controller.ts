import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateProjectInput,
  GetProjectParams,
  ListWorkspaceProjectsQuery,
  UpdateProjectInput,
  UpdateProjectParams,
} from "./project.schema.js";
import {
  createProject,
  getProjectById,
  getWorkspaceProjects,
  updateProject,
} from "./project.service.js";

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
export const listWorkspaceProjectsHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { query } = res.locals.validatedData as {
    query: ListWorkspaceProjectsQuery;
  };

  const result = await getWorkspaceProjects(
    req.workspaceContext.workspace.id,
    query,
  );

  res.status(200).json({
    success: true,
    message: "Workspace projects retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      projects: result.projects,
      pagination: result.pagination,
    },
  });
};
export const getProjectHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: GetProjectParams;
  };

  const project = await getProjectById(
    req.workspaceContext.workspace.id,
    params.projectId,
  );

  res.status(200).json({
    success: true,
    message: "Project retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project,
    },
  });
};
export const updateProjectHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: UpdateProjectParams;
    body: UpdateProjectInput;
  };

  const project = await updateProject(
    req.workspaceContext.workspace.id,
    params.projectId,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Project updated successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project,
    },
  });
};
