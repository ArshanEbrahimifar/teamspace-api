import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateBoardColumnInput,
  CreateBoardColumnParams,
} from "./board-column.schema.js";
import { createBoardColumn } from "./board-column.service.js";

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
