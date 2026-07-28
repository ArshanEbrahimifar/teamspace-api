import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateBoardInput,
  CreateBoardParams,
  DeleteBoardParams,
  GetBoardParams,
  ListProjectBoardsParams,
  UpdateBoardInput,
  UpdateBoardParams,
} from "./board.schema.js";
import {
  createBoard,
  getBoardById,
  getProjectBoards,
  softDeleteBoard,
  updateBoard,
} from "./board.service.js";

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
export const getBoardHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: GetBoardParams;
  };

  const board = await getBoardById(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
  );

  res.status(200).json({
    success: true,
    message: "Board retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: board.project,

      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        position: board.position,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        createdBy: board.createdBy,
      },
    },
  });
};
export const updateBoardHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: UpdateBoardParams;
    body: UpdateBoardInput;
  };

  const board = await updateBoard(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Board updated successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: board.project,

      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        position: board.position,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        createdBy: board.createdBy,
      },
    },
  });
};
export const deleteBoardHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: DeleteBoardParams;
  };

  await softDeleteBoard(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
  );

  res.status(204).send();
};
