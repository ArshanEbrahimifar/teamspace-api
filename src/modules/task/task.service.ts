import { prisma } from "../../config/database.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import { recordActivity } from "../activity/activity.service.js";

import type {
  CreateTaskInput,
  ListColumnTasksQuery,
  MoveTaskInput,
  ReorderColumnTasksInput,
  UpdateTaskInput,
} from "./task.schema.js";

export const createTask = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  createdById: string,
  input: CreateTaskInput,
) => {
  return prisma.$transaction(async (tx) => {
    const column = await tx.boardColumn.findFirst({
      where: {
        id: columnId,
        boardId,
        deletedAt: null,

        board: {
          is: {
            projectId,
            deletedAt: null,

            project: {
              is: {
                workspaceId,
                deletedAt: null,
              },
            },
          },
        },
      },

      select: {
        id: true,
        name: true,
        position: true,

        board: {
          select: {
            id: true,
            name: true,
            description: true,
            position: true,

            project: {
              select: {
                id: true,
                name: true,
                key: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!column) {
      throw new AppError("Board column not found", 404);
    }

    if (input.assigneeId !== undefined && input.assigneeId !== null) {
      const assigneeMembership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: input.assigneeId,
          },
        },

        select: {
          id: true,
        },
      });

      if (!assigneeMembership) {
        throw new AppError("Assignee must be a member of the workspace", 400);
      }
    }

    const lastTask = await tx.task.findFirst({
      where: {
        columnId: column.id,
      },

      orderBy: [
        {
          position: "desc",
        },
        {
          id: "desc",
        },
      ],

      select: {
        position: true,
      },
    });

    const nextPosition = (lastTask?.position ?? -1) + 1;

    const task = await tx.task.create({
      data: {
        columnId: column.id,
        createdById,
        title: input.title,
        position: nextPosition,

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),

        ...(input.priority !== undefined
          ? {
              priority: input.priority,
            }
          : {}),

        ...(input.dueDate !== undefined
          ? {
              dueDate: input.dueDate,
            }
          : {}),

        ...(input.assigneeId !== undefined
          ? {
              assigneeId: input.assigneeId,
            }
          : {}),
      },

      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        position: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    await recordActivity(tx, {
      workspaceId,
      actorId: createdById,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      message: `Created task "${task.title}"`,

      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        columnId: column.id,
        columnName: column.name,
        assigneeId: task.assignee?.id ?? null,
      },
    });

    return {
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
      },

      task,
    };
  });
};
export const getColumnTasks = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  query: ListColumnTasksQuery,
) => {
  return prisma.$transaction(async (tx) => {
    const column = await tx.boardColumn.findFirst({
      where: {
        id: columnId,
        boardId,
        deletedAt: null,

        board: {
          is: {
            projectId,
            deletedAt: null,

            project: {
              is: {
                workspaceId,
                deletedAt: null,
              },
            },
          },
        },
      },

      select: {
        id: true,
        name: true,
        position: true,

        board: {
          select: {
            id: true,
            name: true,
            description: true,
            position: true,

            project: {
              select: {
                id: true,
                name: true,
                key: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!column) {
      throw new AppError("Board column not found", 404);
    }

    const now = new Date();

    const taskWhere = {
      columnId: column.id,
      deletedAt: null,

      ...(query.priority !== undefined
        ? {
            priority: query.priority,
          }
        : {}),

      ...(query.assigneeId !== undefined
        ? {
            assigneeId: query.assigneeId,
          }
        : {}),

      ...(query.dueStatus === "OVERDUE"
        ? {
            dueDate: {
              lt: now,
            },
          }
        : {}),

      ...(query.dueStatus === "UPCOMING"
        ? {
            dueDate: {
              gte: now,
            },
          }
        : {}),

      ...(query.dueStatus === "NO_DUE_DATE"
        ? {
            dueDate: null,
          }
        : {}),
    } satisfies Prisma.TaskWhereInput;

    const skip = (query.page - 1) * query.limit;

    const [tasks, totalItems] = await Promise.all([
      tx.task.findMany({
        where: taskWhere,

        skip,
        take: query.limit,

        orderBy: [
          {
            position: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          position: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,

          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },

          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),

      tx.task.count({
        where: taskWhere,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / query.limit);

    return {
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
      },

      tasks,

      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  });
};
export const getTaskById = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  taskId: string,
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      columnId,
      deletedAt: null,

      column: {
        is: {
          boardId,
          deletedAt: null,

          board: {
            is: {
              projectId,
              deletedAt: null,

              project: {
                is: {
                  workspaceId,
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
    },

    select: {
      id: true,
      title: true,
      description: true,
      priority: true,
      position: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      column: {
        select: {
          id: true,
          name: true,
          position: true,

          board: {
            select: {
              id: true,
              name: true,
              description: true,
              position: true,

              project: {
                select: {
                  id: true,
                  name: true,
                  key: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};
export const updateTask = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  actorId: string,
  input: UpdateTaskInput,
) => {
  return prisma.$transaction(async (tx) => {
    const existingTask = await tx.task.findFirst({
      where: {
        id: taskId,
        columnId,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        dueDate: true,
        assigneeId: true,
      },
    });

    if (!existingTask) {
      throw new AppError("Task not found", 404);
    }

    if (input.assigneeId !== undefined && input.assigneeId !== null) {
      const assigneeMembership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: input.assigneeId,
          },
        },

        select: {
          id: true,
        },
      });

      if (!assigneeMembership) {
        throw new AppError("Assignee must be a member of the workspace", 400);
      }
    }

    const updateResult = await tx.task.updateMany({
      where: {
        id: taskId,
        columnId,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      data: {
        ...(input.title !== undefined
          ? {
              title: input.title,
            }
          : {}),

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),

        ...(input.priority !== undefined
          ? {
              priority: input.priority,
            }
          : {}),

        ...(input.dueDate !== undefined
          ? {
              dueDate: input.dueDate,
            }
          : {}),

        ...(input.assigneeId !== undefined
          ? {
              assigneeId: input.assigneeId,
            }
          : {}),
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError("Task not found", 404);
    }

    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        columnId,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        position: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        column: {
          select: {
            id: true,
            name: true,
            position: true,

            board: {
              select: {
                id: true,
                name: true,
                description: true,
                position: true,

                project: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    const changes: Prisma.JsonObject = {};

    if (existingTask.title !== task.title) {
      changes.title = {
        from: existingTask.title,
        to: task.title,
      };
    }

    if (existingTask.description !== task.description) {
      changes.description = {
        from: existingTask.description,
        to: task.description,
      };
    }

    if (existingTask.priority !== task.priority) {
      changes.priority = {
        from: existingTask.priority,
        to: task.priority,
      };
    }

    const previousDueDate = existingTask.dueDate?.toISOString() ?? null;

    const nextDueDate = task.dueDate?.toISOString() ?? null;

    if (previousDueDate !== nextDueDate) {
      changes.dueDate = {
        from: previousDueDate,
        to: nextDueDate,
      };
    }

    const nextAssigneeId = task.assignee?.id ?? null;

    if (existingTask.assigneeId !== nextAssigneeId) {
      changes.assigneeId = {
        from: existingTask.assigneeId,
        to: nextAssigneeId,
      };
    }

    if (Object.keys(changes).length > 0) {
      await recordActivity(tx, {
        workspaceId,
        actorId,
        action: "TASK_UPDATED",
        entityType: "TASK",
        entityId: task.id,
        message: `Updated task "${task.title}"`,

        metadata: {
          taskTitle: task.title,
          changes,
        },
      });
    }

    return task;
  });
};
export const softDeleteTask = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  taskId: string,
  actorId: string,
): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        columnId,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id: true,
        title: true,
        priority: true,
        position: true,

        column: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    const deletedTask = await tx.task.updateMany({
      where: {
        id: task.id,
        columnId: task.column.id,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      data: {
        deletedAt: new Date(),
      },
    });

    if (deletedTask.count !== 1) {
      throw new AppError("Task changed while deleting", 409);
    }

    await recordActivity(tx, {
      workspaceId,
      actorId,
      action: "TASK_DELETED",
      entityType: "TASK",
      entityId: task.id,
      message: `Deleted task "${task.title}"`,

      metadata: {
        taskTitle: task.title,
        priority: task.priority,
        position: task.position,
        columnId: task.column.id,
        columnName: task.column.name,
      },
    });
  });
};
export const moveTask = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  taskId: string,
  actorId: string,
  input: MoveTaskInput,
) => {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id: true,
        columnId: true,
        position: true,

        column: {
          select: {
            id: true,
            name: true,
            position: true,

            board: {
              select: {
                id: true,
                name: true,
                description: true,
                position: true,

                project: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    const targetColumn = await tx.boardColumn.findFirst({
      where: {
        id: input.targetColumnId,
        boardId,
        deletedAt: null,

        board: {
          is: {
            projectId,
            deletedAt: null,

            project: {
              is: {
                workspaceId,
                deletedAt: null,
              },
            },
          },
        },
      },

      select: {
        id: true,
        name: true,
        position: true,
      },
    });

    if (!targetColumn) {
      throw new AppError("Target board column not found", 404);
    }

    const sourceTasks = await tx.task.findMany({
      where: {
        columnId: task.columnId,
        deletedAt: null,

        id: {
          not: task.id,
        },
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          id: "asc",
        },
      ],

      select: {
        id: true,
      },
    });

    const updateTaskLocation = async (
      currentTaskId: string,
      expectedColumnId: string,
      nextColumnId: string,
      position: number,
    ): Promise<void> => {
      const result = await tx.task.updateMany({
        where: {
          id: currentTaskId,
          columnId: expectedColumnId,
          deletedAt: null,

          column: {
            is: {
              boardId,
              deletedAt: null,

              board: {
                is: {
                  projectId,
                  deletedAt: null,

                  project: {
                    is: {
                      workspaceId,
                      deletedAt: null,
                    },
                  },
                },
              },
            },
          },
        },

        data: {
          columnId: nextColumnId,
          position,
        },
      });

      if (result.count !== 1) {
        throw new AppError("Tasks changed while moving", 409);
      }
    };

    const movedWithinSameColumn = task.columnId === targetColumn.id;

    if (movedWithinSameColumn) {
      const orderedTaskIds = sourceTasks.map((sourceTask) => sourceTask.id);

      if (input.targetPosition > orderedTaskIds.length) {
        throw new AppError("Target position is out of range", 409);
      }

      orderedTaskIds.splice(input.targetPosition, 0, task.id);

      for (const [position, currentTaskId] of orderedTaskIds.entries()) {
        await updateTaskLocation(
          currentTaskId,
          task.columnId,
          task.columnId,
          position,
        );
      }
    } else {
      const targetTasks = await tx.task.findMany({
        where: {
          columnId: targetColumn.id,
          deletedAt: null,
        },

        orderBy: [
          {
            position: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
        },
      });

      if (input.targetPosition > targetTasks.length) {
        throw new AppError("Target position is out of range", 409);
      }

      const sourceTaskIds = sourceTasks.map((sourceTask) => sourceTask.id);

      const targetTaskIds = targetTasks.map((targetTask) => targetTask.id);

      targetTaskIds.splice(input.targetPosition, 0, task.id);

      for (const [position, sourceTaskId] of sourceTaskIds.entries()) {
        await updateTaskLocation(
          sourceTaskId,
          task.columnId,
          task.columnId,
          position,
        );
      }

      for (const [position, targetTaskId] of targetTaskIds.entries()) {
        const isMovedTask = targetTaskId === task.id;

        await updateTaskLocation(
          targetTaskId,
          isMovedTask ? task.columnId : targetColumn.id,
          targetColumn.id,
          position,
        );
      }
    }

    const movedTask = await tx.task.findFirst({
      where: {
        id: task.id,
        columnId: targetColumn.id,
        deletedAt: null,

        column: {
          is: {
            boardId,
            deletedAt: null,

            board: {
              is: {
                projectId,
                deletedAt: null,

                project: {
                  is: {
                    workspaceId,
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        position: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        column: {
          select: {
            id: true,
            name: true,
            position: true,

            board: {
              select: {
                id: true,
                name: true,
                description: true,
                position: true,

                project: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!movedTask) {
      throw new AppError("Task not found", 404);
    }

    await recordActivity(tx, {
      workspaceId,
      actorId,
      action: "TASK_MOVED",
      entityType: "TASK",
      entityId: movedTask.id,
      message: movedWithinSameColumn
        ? `Reordered task "${movedTask.title}" in column "${targetColumn.name}"`
        : `Moved task "${movedTask.title}" from "${task.column.name}" to "${targetColumn.name}"`,

      metadata: {
        taskTitle: movedTask.title,

        fromColumn: {
          id: task.column.id,
          name: task.column.name,
        },

        toColumn: {
          id: targetColumn.id,
          name: targetColumn.name,
        },

        fromPosition: task.position,
        toPosition: movedTask.position,
        movedWithinSameColumn,
      },
    });

    return {
      movedWithinSameColumn,

      previousColumn: {
        id: task.column.id,
        name: task.column.name,
        position: task.column.position,
      },

      task: movedTask,
    };
  });
};
export const reorderColumnTasks = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  input: ReorderColumnTasksInput,
) => {
  return prisma.$transaction(async (tx) => {
    const column = await tx.boardColumn.findFirst({
      where: {
        id: columnId,
        boardId,
        deletedAt: null,

        board: {
          is: {
            projectId,
            deletedAt: null,

            project: {
              is: {
                workspaceId,
                deletedAt: null,
              },
            },
          },
        },
      },

      select: {
        id: true,
        name: true,
        position: true,

        board: {
          select: {
            id: true,
            name: true,
            description: true,
            position: true,

            project: {
              select: {
                id: true,
                name: true,
                key: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!column) {
      throw new AppError("Board column not found", 404);
    }

    const activeTasks = await tx.task.findMany({
      where: {
        columnId: column.id,
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    const activeTaskIds = new Set(activeTasks.map((task) => task.id));

    const requestedTaskIds = new Set(input.taskIds);

    const containsEveryActiveTask =
      activeTaskIds.size === requestedTaskIds.size &&
      [...activeTaskIds].every((taskId) => requestedTaskIds.has(taskId));

    if (!containsEveryActiveTask) {
      throw new AppError(
        "Task order must include every active column task exactly once",
        409,
      );
    }

    const updateResults = await Promise.all(
      input.taskIds.map((taskId, position) =>
        tx.task.updateMany({
          where: {
            id: taskId,
            columnId: column.id,
            deletedAt: null,

            column: {
              is: {
                boardId,
                deletedAt: null,

                board: {
                  is: {
                    projectId,
                    deletedAt: null,

                    project: {
                      is: {
                        workspaceId,
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
            },
          },

          data: {
            position,
          },
        }),
      ),
    );

    const hasFailedUpdate = updateResults.some((result) => result.count !== 1);

    if (hasFailedUpdate) {
      throw new AppError("Tasks changed while reordering", 409);
    }

    const tasks = await tx.task.findMany({
      where: {
        columnId: column.id,
        deletedAt: null,
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          id: "asc",
        },
      ],

      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        position: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,

        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      project: column.board.project,

      board: {
        id: column.board.id,
        name: column.board.name,
        description: column.board.description,
        position: column.board.position,
      },

      column: { id: column.id, name: column.name, position: column.position },

      tasks,
    };
  });
};
