import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateBoardInput } from "./board.schema.js";

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
