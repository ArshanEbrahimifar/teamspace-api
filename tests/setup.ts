import { afterAll, beforeEach } from "vitest";

import { prisma } from "../src/config/database.js";

import { resetDatabase } from "./helpers/reset-database.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
