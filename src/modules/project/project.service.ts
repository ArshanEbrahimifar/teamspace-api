import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { CreateProjectInput } from "./project.schema.js";

export const createProject = async (
  workspaceId: string,
  createdById: string,
  input: CreateProjectInput,
) => {
  const existingProject = await prisma.project.findUnique({
    where: {
      workspaceId_key: {
        workspaceId,
        key: input.key,
      },
    },

    select: {
      id: true,
    },
  });

  if (existingProject) {
    throw new AppError(
      "A project with this key already exists in the workspace",
      409,
    );
  }

  return prisma.project.create({
    data: {
      workspaceId,
      createdById,
      name: input.name,
      key: input.key,

      ...(input.description !== undefined
        ? {
            description: input.description,
          }
        : {}),

      ...(input.startDate !== undefined
        ? {
            startDate: input.startDate,
          }
        : {}),

      ...(input.dueDate !== undefined
        ? {
            dueDate: input.dueDate,
          }
        : {}),
    },

    select: {
      id: true,
      name: true,
      key: true,
      description: true,
      status: true,
      startDate: true,
      dueDate: true,
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
};
