import { prisma } from "../../config/database.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type {
  CreateProjectInput,
  ListWorkspaceProjectsQuery,
  UpdateProjectInput,
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
export const getProjectById = async (
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

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};
export const updateProject = async (
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
) => {
  const currentProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
      deletedAt: null,
    },

    select: {
      id: true,
      startDate: true,
      dueDate: true,
    },
  });

  if (!currentProject) {
    throw new AppError("Project not found", 404);
  }

  const nextStartDate =
    input.startDate === undefined ? currentProject.startDate : input.startDate;

  const nextDueDate =
    input.dueDate === undefined ? currentProject.dueDate : input.dueDate;

  if (nextStartDate && nextDueDate && nextDueDate < nextStartDate) {
    throw new AppError("Project due date cannot be before the start date", 400);
  }

  return prisma.project.update({
    where: {
      id: currentProject.id,
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

      ...(input.status !== undefined
        ? {
            status: input.status,
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
export const softDeleteProject = async (
  workspaceId: string,
  projectId: string,
): Promise<void> => {
  const deletedProject = await prisma.project.updateMany({
    where: {
      id: projectId,
      workspaceId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
  if (deletedProject.count !== 1) {
    throw new AppError("Project not found", 404);
  }
};
