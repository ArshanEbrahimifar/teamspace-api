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

export const workspaceIdParamsSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
    })
    .strict(),
});

export type WorkspaceIdParams = z.infer<
  typeof workspaceIdParamsSchema
>["params"];

export const updateWorkspaceSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
    })
    .strict(),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Workspace name must be at least 2 characters")
        .max(100, "Workspace name must not exceed 100 characters")
        .optional(),

      description: z
        .string()
        .trim()
        .max(500, "Description must not exceed 500 characters")
        .nullable()
        .optional(),

      logoUrl: z.url("Please provide a valid logo URL").nullable().optional(),
    })
    .strict()
    .refine(
      (data) =>
        data.name !== undefined ||
        data.description !== undefined ||
        data.logoUrl !== undefined,
      {
        message: "At least one field must be provided",
      },
    ),
});

export type UpdateWorkspaceInput = z.infer<
  typeof updateWorkspaceSchema
>["body"];

export type UpdateWorkspaceParams = z.infer<
  typeof updateWorkspaceSchema
>["params"];

export const updateWorkspaceMemberRoleSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),

      memberId: z.uuid("Please provide a valid member ID"),
    })
    .strict(),

  body: z
    .object({
      role: z.enum(["ADMIN", "MEMBER"], {
        error: "Role must be either ADMIN or MEMBER",
      }),
    })
    .strict(),
});

export type UpdateWorkspaceMemberRoleParams = z.infer<
  typeof updateWorkspaceMemberRoleSchema
>["params"];

export type UpdateWorkspaceMemberRoleInput = z.infer<
  typeof updateWorkspaceMemberRoleSchema
>["body"];

export const removeWorkspaceMemberSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),

      memberId: z.uuid("Please provide a valid member ID"),
    })
    .strict(),
});

export type RemoveWorkspaceMemberParams = z.infer<
  typeof removeWorkspaceMemberSchema
>["params"];
