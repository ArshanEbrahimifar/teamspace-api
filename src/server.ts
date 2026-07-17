import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import type { Server } from "node:http";
import { prisma } from "./config/database.js";

let server: Server;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    logger.info("Database connected");

    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
        },
        "Server started",
      );
    });
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      "Failed to start server",
    );
    await prisma.$disconnect();
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Shutdown started");

  if (server) {
    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, "Failed to close HTTP server");
      }

      await prisma.$disconnect();

      logger.info("Database disconnected");
      process.exitCode = error ? 1 : 0;
    });

    return;
  }

  await prisma.$disconnect();
  logger.info("Database disconnected");
  process.exitCode = 0;
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void startServer();
