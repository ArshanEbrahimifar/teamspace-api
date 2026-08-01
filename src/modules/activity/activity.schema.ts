import { z } from "zod";

export const activityActionSchema = z.enum([
  "WORKSPACE_CREATED",
  "MEMBER_INVITED",
  "PROJECT_CREATED",
  "BOARD_CREATED",
  "COLUMN_CREATED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_MOVED",
  "TASK_DELETED",
]);

export const activityEntityTypeSchema = z.enum([
  "WORKSPACE",
  "WORKSPACE_INVITATION",
  "PROJECT",
  "BOARD",
  "BOARD_COLUMN",
  "TASK",
]);

export const listWorkspaceActivitiesSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
    })
    .strict(),

  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),

      limit: z.coerce.number().int().min(1).max(100).default(20),

      action: activityActionSchema.optional(),

      entityType: activityEntityTypeSchema.optional(),

      entityId: z.uuid("Please provide a valid entity ID").optional(),

      actorId: z.uuid("Please provide a valid actor ID").optional(),
    })
    .strict()
    .superRefine((query, ctx) => {
      if (query.entityId !== undefined && query.entityType === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["entityType"],
          message: "Entity type is required when entity ID is provided",
        });
      }
    }),
});

export type ListWorkspaceActivitiesParams = z.infer<
  typeof listWorkspaceActivitiesSchema
>["params"];

export type ListWorkspaceActivitiesQuery = z.infer<
  typeof listWorkspaceActivitiesSchema
>["query"];
