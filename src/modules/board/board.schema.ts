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

export const getBoardSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
      projectId: z.uuid("Please provide a valid project ID"),
      boardId: z.uuid("Please provide a valid board ID"),
    })
    .strict(),
});

export type GetBoardParams = z.infer<typeof getBoardSchema>["params"];

export const updateBoardSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),

      projectId: z.uuid("Please provide a valid project ID"),

      boardId: z.uuid("Please provide a valid board ID"),
    })
    .strict(),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Board name must be at least 2 characters")
        .max(100, "Board name cannot exceed 100 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .min(1, "Board description cannot be empty")
        .max(1000, "Board description cannot exceed 1000 characters")
        .nullable()
        .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one board field must be provided",
    }),
});

export type UpdateBoardInput = z.infer<typeof updateBoardSchema>["body"];

export type UpdateBoardParams = z.infer<typeof updateBoardSchema>["params"];
