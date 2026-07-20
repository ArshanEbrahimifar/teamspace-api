import { z } from "zod";

export const createWorkspaceSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Workspace name must be at least 2 characters")
        .max(100, "Workspace name must not exceed 100 characters"),
      description: z
        .string()
        .trim()
        .max(500, "Description must not exceed 500 characters")
        .optional(),
    })
    .strict(),
});

export type CreateWorkspaceInput = z.infer<
  typeof createWorkspaceSchema
>["body"];
