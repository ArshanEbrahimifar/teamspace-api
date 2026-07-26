import { z } from "zod";

const projectDateSchema = z.iso
  .datetime({
    offset: true,
  })
  .transform((value) => new Date(value));

export const createProjectSchema = z.object({
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
        .min(2, "Project name must be at least 2 characters")
        .max(100, "Project name cannot exceed 100 characters"),

      key: z
        .string()
        .trim()
        .toUpperCase()
        .min(2, "Project key must be at least 2 characters")
        .max(10, "Project key cannot exceed 10 characters")
        .regex(
          /^[A-Z][A-Z0-9]*$/,
          "Project key must start with a letter and contain only uppercase letters and numbers",
        ),

      description: z
        .string()
        .trim()
        .min(1, "Project description cannot be empty")
        .max(2000, "Project description cannot exceed 2000 characters")
        .optional(),

      startDate: projectDateSchema.optional(),

      dueDate: projectDateSchema.optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
        ctx.addIssue({
          code: "custom",
          path: ["dueDate"],
          message: "Project due date cannot be before the start date",
        });
      }
    }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>["body"];

export const listWorkspaceProjectsSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
    })
    .strict(),

  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),

      limit: z.coerce.number().int().min(1).max(100).default(10),

      search: z
        .string()
        .trim()
        .min(1, "Search term cannot be empty")
        .max(100, "Search term cannot exceed 100 characters")
        .optional(),

      status: z
        .enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"])
        .optional(),

      sortBy: z
        .enum(["createdAt", "name", "status", "dueDate"])
        .default("createdAt"),

      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict(),
});

export type ListWorkspaceProjectsQuery = z.infer<
  typeof listWorkspaceProjectsSchema
>["query"];

export const getProjectSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),
      projectId: z.uuid("Please provide a valid project ID"),
    })
    .strict(),
});

export type GetProjectParams = z.infer<typeof getProjectSchema>["params"];
