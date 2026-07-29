import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";

import type {
  CreateBoardColumnInput,
  UpdateBoardColumnInput,
} from "./board-column.schema.js";

export const createBoardColumn = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  createdById: string,
  input: CreateBoardColumnInput,
) => {
  return prisma.$transaction(async (tx) => {
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
    });

    if (!board) {
      throw new AppError("Board not found", 404);
    }

    const lastColumn = await tx.boardColumn.findFirst({
      where: {
        boardId: board.id,
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

    const nextPosition = (lastColumn?.position ?? -1) + 1;

    const column = await tx.boardColumn.create({
      data: {
        boardId: board.id,
        createdById,
        name: input.name,
        position: nextPosition,
      },

      select: {
        id: true,
        name: true,
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

    return {
      project: board.project,

      board: {
        id: board.id,
        name: board.name,
        position: board.position,
      },

      column,
    };
  });
};
export const getBoardColumns = async (
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

      project: {
        select: {
          id: true,
          name: true,
          key: true,
          status: true,
        },
      },

      columns: {
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

  if (!board) {
    throw new AppError("Board not found", 404);
  }

  return board;
};
export const getBoardColumnById = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
) => {
  const column = await prisma.boardColumn.findFirst({
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

  return column;
};
export const updateBoardColumn = async (
  workspaceId: string,
  projectId: string,
  boardId: string,
  columnId: string,
  input: UpdateBoardColumnInput,
) => {
  return prisma.$transaction(async (tx) => {
    const updatedColumn = await tx.boardColumn.updateMany({
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

      data: {
        name: input.name,
      },
    });

    if (updatedColumn.count !== 1) {
      throw new AppError("Board column not found", 404);
    }

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

    return column;
  });
};
