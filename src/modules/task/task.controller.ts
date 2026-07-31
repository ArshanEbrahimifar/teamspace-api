import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type { CreateTaskInput, CreateTaskParams } from "./task.schema.js";
import { createTask } from "./task.service.js";

export const createTaskHandler: RequestHandler = async (req, res) => {
  if (!req.auth || !req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: CreateTaskParams;
    body: CreateTaskInput;
  };

  const result = await createTask(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    req.auth.user.id,
    body,
  );

  res.status(201).json({
    success: true,
    message: "Task created successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: result.project,
      board: result.board,
      column: result.column,
      task: result.task,
    },
  });
};
