import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { generateWorkspaceSlug } from "../../shared/utils/slug.js";

import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspace.schema.js";

export const createWorkspace = async (
  input: CreateWorkspaceInput,
  ownerUserId: string,
) => {
  const slug = generateWorkspaceSlug(input.name);

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.name,
        slug,

        ...(input.description !== undefined
          ? {
              description: input.description,
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        createdAt: true,
      },
    });

    const membership = await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: ownerUserId,
        role: "OWNER",
      },

      select: {
        id: true,
        role: true,
        joinedAt: true,
      },
    });

    return {
      workspace,
      membership,
    };
  });
};
export const getUserWorkspaces = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId,
      workspace: {
        deletedAt: null,
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });
  return memberships.map((membership) => ({
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      description: membership.workspace.description,
      logoUrl: membership.workspace.logoUrl,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
      memberCount: membership.workspace._count.members,
    },

    membership: {
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
    },
  }));
};
export const getWorkspaceById = async (workspaceId: string, userId: string) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });
  if (!membership || membership.workspace.deletedAt) {
    throw new AppError("Workspace not found", 404);
  }
  return {
    workspace: {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      description: membership.workspace.description,
      logoUrl: membership.workspace.logoUrl,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,
      memberCount: membership.workspace._count.members,
    },

    membership: {
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
    },
  };
};
export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceInput,
) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },

    select: {
      id: true,
      role: true,
      joinedAt: true,

      workspace: {
        select: {
          deletedAt: true,
        },
      },
    },
  });

  if (!membership || membership.workspace.deletedAt) {
    throw new AppError("Workspace not found", 404);
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new AppError(
      "You do not have permission to update this workspace",
      403,
    );
  }

  const workspace = await prisma.workspace.update({
    where: {
      id: workspaceId,
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

      ...(input.logoUrl !== undefined
        ? {
            logoUrl: input.logoUrl,
          }
        : {}),
    },

    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    workspace,

    membership: {
      id: membership.id,
      role: membership.role,
      joinedAt: membership.joinedAt,
    },
  };
};
