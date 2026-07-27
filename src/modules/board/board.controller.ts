import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateBoardInput,
  CreateBoardParams,
  ListProjectBoardsParams,
} from "./board.schema.js";
import { createBoard, getProjectBoards } from "./board.service.js";

export const createBoardHandler: RequestHandler = async (req, res) => {
  if (!req.auth || !req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: CreateBoardParams;
    body: CreateBoardInput;
  };

  const result = await createBoard(
    req.workspaceContext.workspace.id,
    params.projectId,
    req.auth.user.id,
    body,
  );

  res.status(201).json({
    success: true,
    message: "Board created successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: result.project,
      board: result.board,
    },
  });
};
export const listProjectBoardsHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: ListProjectBoardsParams;
  };

  const project = await getProjectBoards(
    req.workspaceContext.workspace.id,
    params.projectId,
  );

  res.status(200).json({
    success: true,
    message: "Project boards retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: {
        id: project.id,
        name: project.name,
        key: project.key,
        status: project.status,
      },

      boards: project.boards,
    },
  });
};
