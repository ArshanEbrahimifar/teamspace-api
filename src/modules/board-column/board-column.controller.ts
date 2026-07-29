import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateBoardColumnInput,
  CreateBoardColumnParams,
  DeleteBoardColumnParams,
  GetBoardColumnsParams,
  ListBoardColumnsParams,
  UpdateBoardColumnInput,
  UpdateBoardColumnParams,
} from "./board-column.schema.js";
import {
  createBoardColumn,
  getBoardColumnById,
  getBoardColumns,
  softDeleteBoardColumn,
  updateBoardColumn,
} from "./board-column.service.js";

export const createBoardColumnHandler: RequestHandler = async (req, res) => {
  if (!req.auth || !req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: CreateBoardColumnParams;
    body: CreateBoardColumnInput;
  };

  const result = await createBoardColumn(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    req.auth.user.id,
    body,
  );

  res.status(201).json({
    success: true,
    message: "Board column created successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: result.project,
      board: result.board,
      column: result.column,
    },
  });
};
export const listBoardColumnsHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: ListBoardColumnsParams;
  };

  const board = await getBoardColumns(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
  );

  res.status(200).json({
    success: true,
    message: "Board columns retrieved successfully",

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
      },

      columns: board.columns,
    },
  });
};
export const getBoardColumnHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: GetBoardColumnsParams;
  };

  const column = await getBoardColumnById(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
  );

  res.status(200).json({
    success: true,
    message: "Board column retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: column.board.project,

      board: {
        id: column.board.id,
        name: column.board.name,
        description: column.board.description,
        position: column.board.position,
      },

      column: {
        id: column.id,
        name: column.name,
        position: column.position,
        createdAt: column.createdAt,
        updatedAt: column.updatedAt,
        createdBy: column.createdBy,
      },
    },
  });
};
export const updateBoardColumnHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: UpdateBoardColumnParams;
    body: UpdateBoardColumnInput;
  };

  const column = await updateBoardColumn(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Board column updated successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: column.board.project,

      board: {
        id: column.board.id,
        name: column.board.name,
        description: column.board.description,
        position: column.board.position,
      },

      column: {
        id: column.id,
        name: column.name,
        position: column.position,
        createdAt: column.createdAt,
        updatedAt: column.updatedAt,
        createdBy: column.createdBy,
      },
    },
  });
};
export const deleteBoardColumnHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: DeleteBoardColumnParams;
  };

  await softDeleteBoardColumn(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
  );

  res.status(204).send();
};
