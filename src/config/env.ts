import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(64, "JWT_ACCESS_SECRET must be at least 64 characters"),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "JWT_ACCESS_EXPIRES_IN must look like 15m, 1h, or 7d")
    .default("15m"),

  JWT_ISSUER: z.string().min(1).default("teamspace-api"),

  JWT_AUDIENCE: z.string().min(1).default("teamspace-client"),

  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),

  WORKSPACE_INVITATION_EXPIRES_IN_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(7),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid Environment variables:");
  console.error(z.treeifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
