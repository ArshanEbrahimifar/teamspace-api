import { config } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

if (existsSync(".env.test")) {
  config({
    path: ".env.test",
    override: true,
  });
}

export default defineConfig({
  test: {
    environment: "node",

    include: ["tests/**/*.test.ts"],

    setupFiles: ["./tests/setup.ts"],

    fileParallelism: false,

    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
