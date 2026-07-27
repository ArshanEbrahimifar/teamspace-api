import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type { CreateBoardInput, CreateBoardParams } from "./board.schema.js";
import { createBoard } from "./board.service.js";

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
