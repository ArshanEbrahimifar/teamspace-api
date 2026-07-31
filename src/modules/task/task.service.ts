import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

import type { CreateTaskInput } from "./task.schema.js";

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
