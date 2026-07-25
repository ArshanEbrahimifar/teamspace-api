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
