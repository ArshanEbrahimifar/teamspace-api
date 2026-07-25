import { prisma } from "../../config/database.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreateProjectInput,
  ListWorkspaceProjectsQuery,
} from "./project.schema.js";

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
export const getWorkspaceProjects = async (
  workspaceId: string,
  query: ListWorkspaceProjectsQuery,
) => {
  const skip = (query.page - 1) * query.limit;

  const where = {
    workspaceId,
    deletedAt: null,

    ...(query.status !== undefined
      ? {
          status: query.status,
        }
      : {}),

    ...(query.search !== undefined
      ? {
          OR: [
            {
              name: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              key: {
                contains: query.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  } satisfies Prisma.ProjectWhereInput;

  const orderBy: Prisma.ProjectOrderByWithRelationInput =
    query.sortBy === "name"
      ? {
          name: query.sortOrder,
        }
      : query.sortBy === "status"
        ? {
            status: query.sortOrder,
          }
        : query.sortBy === "dueDate"
          ? {
              dueDate: query.sortOrder,
            }
          : {
              createdAt: query.sortOrder,
            };

  const [projects, totalItems] = await prisma.$transaction([
    prisma.project.findMany({
      where,

      skip,
      take: query.limit,

      orderBy: [
        orderBy,
        {
          id: "asc",
        },
      ],

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
    }),

    prisma.project.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / query.limit);

  return {
    projects,

    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    },
  };
};
