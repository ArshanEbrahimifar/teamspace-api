import { z } from "zod";

export const createBoardSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
      projectId: z.uuid("Please provide a valid project ID"),
    })
    .strict(),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Board name must be at least 2 characters")
        .max(100, "Board name cannot exceed 100 characters"),
      description: z
        .string()
        .trim()
        .min(1, "Board description cannot be empty")
        .max(1000, "Board description cannot exceed 1000 characters")
        .optional(),
    })
    .strict(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>["body"];
export type CreateBoardParams = z.infer<typeof createBoardSchema>["params"];

export const listProjectBoardsSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),

      projectId: z.uuid("Please provide a valid project ID"),
    })
    .strict(),
});

export type ListProjectBoardsParams = z.infer<
  typeof listProjectBoardsSchema
>["params"];
