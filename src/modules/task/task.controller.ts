import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateTaskInput,
  CreateTaskParams,
  DeleteTaskParams,
  GetTaskParams,
  ListColumnTasksParams,
  ListColumnTasksQuery,
  MoveTaskInput,
  MoveTaskParams,
  ReorderColumnTasksInput,
  ReorderColumnTasksParams,
  UpdateTaskInput,
  UpdateTaskParams,
} from "./task.schema.js";
import {
  createTask,
  getColumnTasks,
  getTaskById,
  moveTask,
  reorderColumnTasks,
  softDeleteTask,
  updateTask,
} from "./task.service.js";

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
export const getTaskHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: GetTaskParams;
  };

  const task = await getTaskById(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    params.taskId,
  );

  res.status(200).json({
    success: true,
    message: "Task retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: task.column.board.project,

      board: {
        id: task.column.board.id,
        name: task.column.board.name,
        description: task.column.board.description,
        position: task.column.board.position,
      },

      column: {
        id: task.column.id,
        name: task.column.name,
        position: task.column.position,
      },

      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        position: task.position,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignee: task.assignee,
        createdBy: task.createdBy,
      },
    },
  });
};
export const updateTaskHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: UpdateTaskParams;
    body: UpdateTaskInput;
  };

  const task = await updateTask(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    params.taskId,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Task updated successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: task.column.board.project,

      board: {
        id: task.column.board.id,
        name: task.column.board.name,
        description: task.column.board.description,
        position: task.column.board.position,
      },

      column: {
        id: task.column.id,
        name: task.column.name,
        position: task.column.position,
      },

      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        position: task.position,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignee: task.assignee,
        createdBy: task.createdBy,
      },
    },
  });
};
export const deleteTaskHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params } = res.locals.validatedData as {
    params: DeleteTaskParams;
  };

  await softDeleteTask(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    params.taskId,
  );

  res.status(204).send();
};
export const moveTaskHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: MoveTaskParams;
    body: MoveTaskInput;
  };

  const result = await moveTask(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.taskId,
    body,
  );

  const movedTask = result.task;

  res.status(200).json({
    success: true,
    message: "Task moved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: movedTask.column.board.project,

      board: {
        id: movedTask.column.board.id,
        name: movedTask.column.board.name,
        description: movedTask.column.board.description,
        position: movedTask.column.board.position,
      },

      movedWithinSameColumn: result.movedWithinSameColumn,

      previousColumn: result.previousColumn,

      targetColumn: {
        id: movedTask.column.id,
        name: movedTask.column.name,
        position: movedTask.column.position,
      },

      task: {
        id: movedTask.id,
        title: movedTask.title,
        description: movedTask.description,
        priority: movedTask.priority,
        position: movedTask.position,
        dueDate: movedTask.dueDate,
        createdAt: movedTask.createdAt,
        updatedAt: movedTask.updatedAt,
        assignee: movedTask.assignee,
        createdBy: movedTask.createdBy,
      },
    },
  });
};
export const reorderColumnTasksHandler: RequestHandler = async (req, res) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { params, body } = res.locals.validatedData as {
    params: ReorderColumnTasksParams;
    body: ReorderColumnTasksInput;
  };

  const result = await reorderColumnTasks(
    req.workspaceContext.workspace.id,
    params.projectId,
    params.boardId,
    params.columnId,
    body,
  );

  res.status(200).json({
    success: true,
    message: "Column tasks reordered successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      project: result.project,
      board: result.board,
      column: result.column,
      tasks: result.tasks,
    },
  });
};
