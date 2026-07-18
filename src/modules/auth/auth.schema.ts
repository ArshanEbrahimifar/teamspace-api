import { z } from "zod";

export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, "Name must be atleast 2 characters")
        .max(100, "Name must not exceed 100 characters"),
      email: z.string().trim().toLowerCase(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must not exceed 128 characters"),
    })
    .strict(),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().toLowerCase(),
      password: z
        .string()
        .min(1, "Password is required")
        .max(128, "Password must not exceed 128 characters"),
    })
    .strict(),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
