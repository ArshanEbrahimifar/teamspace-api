import { prisma } from "../../config/database.js";
import { generateWorkspaceSlug } from "../../shared/utils/slug.js";

import type { CreateWorkspaceInput } from "./workspace.schema.js";

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
