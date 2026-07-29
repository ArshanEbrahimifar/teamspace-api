import { z } from "zod";

export const createBoardColumnSchema = z.object({
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
        .min(2, "Column name must be at least 2 characters")
        .max(100, "Column name cannot exceed 100 characters"),
    })
    .strict(),
});

export type CreateBoardColumnParams = z.infer<
  typeof createBoardColumnSchema
>["params"];

export type CreateBoardColumnInput = z.infer<
  typeof createBoardColumnSchema
>["body"];

export const listBoardColumnsSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
      projectId: z.uuid("Please provide a valid project ID"),
      boardId: z.uuid("Please provide a valid board ID"),
    })
    .strict(),
});

export type ListBoardColumnsParams = z.infer<
  typeof listBoardColumnsSchema
>["params"];

export const getBoardColumnSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
      projectId: z.uuid("Please provide a valid project ID"),
      boardId: z.uuid("Please provide a valid board ID"),
      columnId: z.uuid("Please provide a valid column ID"),
    })
    .strict(),
});

export type GetBoardColumnsParams = z.infer<
  typeof getBoardColumnSchema
>["params"];

export const updateBoardColumnSchema = getBoardColumnSchema.extend({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Column name must be at least 2 characters")
        .max(100, "Column name cannot exceed 100 characters"),
    })
    .strict(),
});

export type UpdateBoardColumnParams = z.infer<
  typeof updateBoardColumnSchema
>["params"];

export type UpdateBoardColumnInput = z.infer<
  typeof updateBoardColumnSchema
>["body"];
