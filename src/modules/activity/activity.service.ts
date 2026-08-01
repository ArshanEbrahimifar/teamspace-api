import { prisma } from "../../config/database.js";
import type {
  ActivityAction,
  ActivityEntityType,
  Prisma,
} from "../../generated/prisma/client.js";
import type { ListWorkspaceActivitiesQuery } from "./activity.schema.js";

type RecordActivityInput = {
  workspaceId: string;
  actorId?: string | null;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

export const recordActivity = async (
  tx: Prisma.TransactionClient,
  input: RecordActivityInput,
): Promise<void> => {
  await tx.activityLog.create({
    data: {
      workspaceId: input.workspaceId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      message: input.message,

      ...(input.actorId !== undefined
        ? {
            actorId: input.actorId,
          }
        : {}),

      ...(input.metadata !== undefined
        ? {
            metadata: input.metadata,
          }
        : {}),
    },

    select: {
      id: true,
    },
  });
};
export const getWorkspaceActivities = async (
  workspaceId: string,
  query: ListWorkspaceActivitiesQuery,
) => {
  const activityWhere = {
    workspaceId,

    ...(query.action !== undefined
      ? {
          action: query.action,
        }
      : {}),

    ...(query.entityType !== undefined
      ? {
          entityType: query.entityType,
        }
      : {}),

    ...(query.entityId !== undefined
      ? {
          entityId: query.entityId,
        }
      : {}),

    ...(query.actorId !== undefined
      ? {
          actorId: query.actorId,
        }
      : {}),
  } satisfies Prisma.ActivityLogWhereInput;

  const skip = (query.page - 1) * query.limit;

  const [activities, totalItems] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where: activityWhere,

      skip,
      take: query.limit,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        message: true,
        metadata: true,
        createdAt: true,

        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }),

    prisma.activityLog.count({
      where: activityWhere,
    }),
  ]);

  const totalPages = Math.ceil(totalItems / query.limit);

  return {
    activities,

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
