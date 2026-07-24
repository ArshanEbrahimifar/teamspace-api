import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashInvitationToken } from "../../shared/utils/invitation-token.js";
import type {
  AcceptWorkspaceInvitationInput,
  DeclineWorkspaceInvitationInput,
} from "./invitation.schema.js";

export const getCurrentUserInvitations = async (userEmail: string) => {
  const normalizedEmail = userEmail.trim().toLowerCase();

  const invitations = await prisma.workspaceInvitation.findMany({
    where: {
      email: normalizedEmail,

      workspace: {
        is: {
          deletedAt: null,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      declinedAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,

      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },

      invitedBy: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  const now = new Date();

  return invitations.map((invitation) => {
    const isExpired =
      invitation.status === "PENDING" && invitation.expiresAt <= now;

    const canRespond = invitation.status === "PENDING" && !isExpired;

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      isExpired,
      canRespond,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      declinedAt: invitation.declinedAt,
      revokedAt: invitation.revokedAt,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      workspace: invitation.workspace,
      invitedBy: invitation.invitedBy,
    };
  });
};
export const acceptWorkspaceInvitation = async (
  userId: string,
  userEmail: string,
  input: AcceptWorkspaceInvitationInput,
) => {
  const tokenHash = hashInvitationToken(input.token);

  const normalizedUserEmail = userEmail.trim().toLowerCase();

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.workspaceInvitation.findUnique({
      where: {
        tokenHash,
      },

      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,

        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new AppError("Invitation not found", 404);
    }

    const normalizedInvitationEmail = invitation.email.trim().toLowerCase();

    if (normalizedInvitationEmail !== normalizedUserEmail) {
      throw new AppError("This invitation was not issued to your account", 403);
    }

    if (invitation.workspace.deletedAt) {
      throw new AppError("Workspace not found", 404);
    }

    if (invitation.status !== "PENDING") {
      throw new AppError("Invitation is no longer available", 409);
    }

    if (invitation.expiresAt <= now) {
      throw new AppError("Invitation has expired", 409);
    }

    const existingMembership = await tx.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },

      select: {
        id: true,
      },
    });

    if (existingMembership) {
      throw new AppError("You are already a workspace member", 409);
    }

    const acceptedInvitation = await tx.workspaceInvitation.updateMany({
      where: {
        id: invitation.id,
        status: "PENDING",

        expiresAt: {
          gt: now,
        },
      },

      data: {
        status: "ACCEPTED",
        acceptedAt: now,
      },
    });

    if (acceptedInvitation.count !== 1) {
      throw new AppError("Invitation is no longer available", 409);
    }

    const membership = await tx.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      },

      select: {
        id: true,
        role: true,
        joinedAt: true,
      },
    });

    return {
      workspace: {
        id: invitation.workspace.id,
        name: invitation.workspace.name,
        slug: invitation.workspace.slug,
        logoUrl: invitation.workspace.logoUrl,
      },

      membership,

      invitation: {
        id: invitation.id,
        status: "ACCEPTED",
        acceptedAt: now,
      },
    };
  });
};
export const declineWorkspaceInvitation = async (
  userEmail: string,
  input: DeclineWorkspaceInvitationInput,
) => {
  const tokenHash = hashInvitationToken(input.token);

  const normalizedUserEmail = userEmail.trim().toLowerCase();

  const now = new Date();

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: {
      tokenHash,
    },

    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,

      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new AppError("Invitation not found", 404);
  }

  const normalizedInvitationEmail = invitation.email.trim().toLowerCase();

  if (normalizedInvitationEmail !== normalizedUserEmail) {
    throw new AppError("This invitation was not issued to your account", 403);
  }

  if (invitation.workspace.deletedAt) {
    throw new AppError("Workspace not found", 404);
  }

  if (invitation.status !== "PENDING") {
    throw new AppError("Invitation is no longer available", 409);
  }

  if (invitation.expiresAt <= now) {
    throw new AppError("Invitation has expired", 409);
  }

  const declinedInvitation = await prisma.workspaceInvitation.updateMany({
    where: {
      id: invitation.id,
      status: "PENDING",

      expiresAt: {
        gt: now,
      },
    },

    data: {
      status: "DECLINED",
      declinedAt: now,
    },
  });

  if (declinedInvitation.count !== 1) {
    throw new AppError("Invitation is no longer available", 409);
  }

  return {
    workspace: {
      id: invitation.workspace.id,
      name: invitation.workspace.name,
      slug: invitation.workspace.slug,
      logoUrl: invitation.workspace.logoUrl,
    },

    invitation: {
      id: invitation.id,
      status: "DECLINED" as const,
      declinedAt: now,
    },
  };
};
