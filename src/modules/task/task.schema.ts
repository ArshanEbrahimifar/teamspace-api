import { z } from "zod";

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const taskDueDateSchema = z.iso
  .datetime({
    offset: true,
  })
  .transform((value) => new Date(value));

export const createTaskSchema = z.object({
  params: z
    .object({
      workspaceId: z.uuid("Please provide a valid workspace ID"),

      projectId: z.uuid("Please provide a valid project ID"),

      boardId: z.uuid("Please provide a valid board ID"),

      columnId: z.uuid("Please provide a valid column ID"),
    })
    .strict(),

  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(2, "Task title must be at least 2 characters")
        .max(200, "Task title cannot exceed 200 characters"),

      description: z
        .string()
        .trim()
        .min(1, "Task description cannot be empty")
        .max(5000, "Task description cannot exceed 5000 characters")
        .nullable()
        .optional(),

      priority: taskPrioritySchema.optional(),

      dueDate: taskDueDateSchema.nullable().optional(),

      assigneeId: z
        .uuid("Please provide a valid assignee ID")
        .nullable()
        .optional(),
    })
    .strict(),
});

export type CreateTaskParams = z.infer<typeof createTaskSchema>["params"];

export type CreateTaskInput = z.infer<typeof createTaskSchema>["body"];
