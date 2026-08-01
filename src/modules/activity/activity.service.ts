import type {
  ActivityAction,
  ActivityEntityType,
  Prisma,
} from "../../generated/prisma/client.js";

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
