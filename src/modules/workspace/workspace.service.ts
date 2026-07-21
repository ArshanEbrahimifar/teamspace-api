import { prisma } from "../../config/database.js";
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

export const updateWorkspace = async (
  workspaceId: string,
  input: UpdateWorkspaceInput,
) => {
  return prisma.workspace.update({
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

      _count: {
        select: {
          members: true,
        },
      },
    },
  });
};
