import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateBoardColumnInput,
  CreateBoardColumnParams,
  ListBoardColumnsParams,
} from "./board-column.schema.js";
import { createBoardColumn, getBoardColumns } from "./board-column.service.js";

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
