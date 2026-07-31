import { prisma } from "../../config/database.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateTaskInput,
  ListColumnTasksQuery,
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
  input: UpdateTaskInput,
) => {
  return prisma.$transaction(async (tx) => {
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

    const updatedTask = await tx.task.updateMany({
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

    if (updatedTask.count !== 1) {
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

    return task;
  });
};
