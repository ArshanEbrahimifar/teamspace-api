import { prisma } from "../../src/config/database.js";

const ensureTestDatabase = (): void => {
  const databaseUrl = process.env.DATABASE_URL;

  if (
    process.env.NODE_ENV !== "test" ||
    !databaseUrl?.includes("teamspace_test")
  ) {
    throw new Error("Database reset is only allowed for the test database");
  }
};

export const resetDatabase = async (): Promise<void> => {
  ensureTestDatabase();

  await prisma.$transaction(async (tx) => {
    await tx.activityLog.deleteMany();

    await tx.task.deleteMany();
    await tx.boardColumn.deleteMany();
    await tx.board.deleteMany();
    await tx.project.deleteMany();

    await tx.workspaceInvitation.deleteMany();
    await tx.workspaceMember.deleteMany();
    await tx.workspace.deleteMany();

    await tx.authSession.deleteMany();
    await tx.user.deleteMany();
  });
};
