import { prisma } from "../../config/database.js";

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
