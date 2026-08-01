import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { recordActivity } from "../activity/activity.service.js";
import type { CreateBoardInput, UpdateBoardInput } from "./board.schema.js";

export const createBoard = async (
  workspaceId: string,
  projectId: string,
  createdById: string,
  input: CreateBoardInput,
) => {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
        deletedAt: null,
      },

      select: {
        id: true,
        name: true,
        key: true,
        status: true,
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const lastBoard = await tx.board.findFirst({
      where: {
        projectId: project.id,
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

    const nextPosition = (lastBoard?.position ?? -1) + 1;

    const board = await tx.board.create({
      data: {
        projectId: project.id,
        createdById,
        name: input.name,
        position: nextPosition,

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        description: true,
        position: true,
        createdAt: true,
        updatedAt: true,

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
      action: "BOARD_CREATED",
      entityType: "BOARD",
      entityId: board.id,
      message: `Created board "${board.name}"`,

      metadata: {
        boardName: board.name,
        description: board.description,
        position: board.position,
        projectId: project.id,
        projectName: project.name,
      },
    });

    return {
      project,
      board,
    };
  });
};
export const getProjectBoards = async (
  workspaceId: string,
  projectId: string,
) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
      deletedAt: null,
    },

    select: {
      id: true,
      name: true,
      key: true,
      status: true,

      boards: {
        where: {
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
          name: true,
          description: true,
          position: true,
          createdAt: true,
          updatedAt: true,

          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};
export const getBoardById = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      projectId,
      deletedAt: null,

      project: {
        is: {
          workspaceId,
          deletedAt: null,
        },
      },
    },

    select: {
      id: true,
      name: true,
      description: true,
      position: true,
      createdAt: true,
      updatedAt: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      project: {
        select: {
          id: true,
          name: true,
          key: true,
          status: true,
        },
      },
    },
  });

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  return board;
};
export const updateBoard = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  input: UpdateBoardInput,
) => {
  return prisma.$transaction(async (tx) => {
    const updatedBoard = await tx.board.updateMany({
      where: {
        id: boardId,
        projectId,
        deletedAt: null,

        project: {
          is: {
            workspaceId,
            deletedAt: null,
          },
        },
      },

      data: {
        ...(input.name !== undefined
          ? {
              name: input.name,
            }
          : {}),

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),
      },
    });

    if (updatedBoard.count !== 1) {
      throw new AppError("Board not found", 404);
    }

    const board = await tx.board.findFirst({
      where: {
        id: boardId,
        projectId,
        deletedAt: null,

        project: {
          is: {
            workspaceId,
            deletedAt: null,
          },
        },
      },

      select: {
        id: true,
        name: true,
        description: true,
        position: true,
        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        project: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
          },
        },
      },
    });

    if (!board) {
      throw new AppError("Board not found", 404);
    }

    return board;
  });
};
export const softDeleteBoard = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
): Promise<void> => {
  const deletedBoard = await prisma.board.updateMany({
    where: {
      id: boardId,
      projectId,
      deletedAt: null,

      project: {
        is: {
          workspaceId,
          deletedAt: null,
        },
      },
    },

    data: {
      deletedAt: new Date(),
    },
  });

  if (deletedBoard.count !== 1) {
    throw new AppError("Board not found", 404);
  }
};
