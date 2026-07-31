import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateTaskInput,
  CreateTaskParams,
  ListColumnTasksParams,
  ListColumnTasksQuery,
} from "./task.schema.js";
import { createTask, getColumnTasks } from "./task.service.js";

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
export const listColumnTasksHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, query } = res.locals.validatedData as {
    params: ListColumnTasksParams;
    query: ListColumnTasksQuery;
  };

  const result = await getColumnTasks(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    query,
  );

  res.status(200).json({
    success: true,
    message: "Column tasks retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: result.project,
      board: result.board,
      column: result.column,
      tasks: result.tasks,
      pagination: result.pagination,
    },
  });
};
