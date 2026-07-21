import type { RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error.js";
import { prisma } from "../config/database.js";
import type { WorkspaceRole } from "../generated/prisma/enums.js";

export const authorizeWorkspaceRoles = (
  ...allowedRoles: WorkspaceRole[]
): RequestHandler => {
  return async (req, res, next) => {
    if (!req.auth) {
      throw new AppError("Authentication is required", 401);
    }

    const { params } = res.locals.validatedData as {
      params: {
        workspaceId: string;
      };
    };

    const { workspaceId } = params;
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.auth.user.id,
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

    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
      );
    }

    req.workspaceContext = {
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

    next();
  };
};
