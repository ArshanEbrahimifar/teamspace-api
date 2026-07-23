import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import type { WorkspaceRole } from "../../generated/prisma/enums.js";
import { AppError } from "../../shared/errors/app-error.js";
import { createInvitationToken } from "../../shared/utils/invitation-token.js";
import { generateWorkspaceSlug } from "../../shared/utils/slug.js";

import type {
  CreateWorkspaceInput,
  CreateWorkspaceInvitationInput,
  UpdateWorkspaceInput,
  UpdateWorkspaceMemberRoleInput,
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
export const softDeleteWorkspace = async (
  workspaceId: string,
): Promise<void> => {
  await prisma.workspace.update({
    where: {
      id: workspaceId,
    },
    data: {
      deletedAt: new Date(),
    },
  });
};
export const getWorkspaceMembers = async (workspaceId: string) => {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
    },

    orderBy: {
      joinedAt: "asc",
    },

    select: {
      id: true,
      role: true,
      joinedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return members.map((member) => ({
    membership: {
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
    },

    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
    },
  }));
};
export const updateWorkspaceMemberRole = async (
  workspaceId: string,
  memberId: string,
  input: UpdateWorkspaceMemberRoleInput,
) => {
  const targetMember = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId,
    },

    select: {
      id: true,
      role: true,
      joinedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!targetMember) {
    throw new AppError("Workspace member not found", 404);
  }

  if (targetMember.role === "OWNER") {
    throw new AppError("Workspace owner role cannot be changed", 409);
  }

  const updatedMember = await prisma.workspaceMember.update({
    where: {
      id: targetMember.id,
    },

    data: {
      role: input.role,
    },

    select: {
      id: true,
      role: true,
      joinedAt: true,

      user: {
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
    membership: {
      id: updatedMember.id,
      role: updatedMember.role,
      joinedAt: updatedMember.joinedAt,
    },

    user: {
      id: updatedMember.user.id,
      name: updatedMember.user.name,
      email: updatedMember.user.email,
      avatarUrl: updatedMember.user.avatarUrl,
    },
  };
};

export const removeWorkspaceMember = async (
  workspaceId: string,
  memberId: string,
  requesterRole: WorkspaceRole,
): Promise<void> => {
  const targetMember = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId,
    },

    select: {
      id: true,
      role: true,
    },
  });

  if (!targetMember) {
    throw new AppError("Workspace member not found", 404);
  }

  if (targetMember.role === "OWNER") {
    throw new AppError("Workspace owner cannot be removed", 409);
  }

  if (requesterRole === "ADMIN" && targetMember.role !== "MEMBER") {
    throw new AppError("Admins can only remove regular members", 403);
  }

  await prisma.workspaceMember.delete({
    where: {
      id: targetMember.id,
    },
  });
};
export const createWorkspaceInvitation = async (
  workspaceId: string,
  invitedById: string,
  input: CreateWorkspaceInvitationInput,
) => {
  const now = new Date();

  const expiresAt = new Date(
    now.getTime() +
      env.WORKSPACE_INVITATION_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  );

  const { token, tokenHash } = createInvitationToken();

  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: {
        email: input.email,
      },

      select: {
        id: true,
      },
    });

    if (existingUser) {
      const existingMembership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id,
          },
        },

        select: {
          id: true,
        },
      });

      if (existingMembership) {
        throw new AppError("User is already a workspace member", 409);
      }
    }

    const existingInvitation = await tx.workspaceInvitation.findUnique({
      where: {
        workspaceId_email: {
          workspaceId,
          email: input.email,
        },
      },

      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });

    if (
      existingInvitation?.status === "PENDING" &&
      existingInvitation.expiresAt > now
    ) {
      throw new AppError(
        "An active invitation already exists for this email",
        409,
      );
    }

    const invitationSelect = {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,

      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    } as const;

    const invitation = existingInvitation
      ? await tx.workspaceInvitation.update({
          where: {
            id: existingInvitation.id,
          },

          data: {
            role: input.role,
            status: "PENDING",
            tokenHash,
            invitedById,
            expiresAt,
            acceptedAt: null,
            declinedAt: null,
            revokedAt: null,
          },

          select: invitationSelect,
        })
      : await tx.workspaceInvitation.create({
          data: {
            workspaceId,
            email: input.email,
            role: input.role,
            tokenHash,
            invitedById,
            expiresAt,
          },

          select: invitationSelect,
        });

    return {
      invitation,
      invitationToken: token,
      wasReissued: existingInvitation !== null,
    };
  });
};
