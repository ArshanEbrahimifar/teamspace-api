import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import { AppError } from "../shared/errors/app-error.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { Prisma } from "../generated/prisma/client.js";

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(env.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with this value already exists",
        ...(env.NODE_ENV === "development" && {
          stack: error.stack,
        }),
      });
      return;
    }
  }

  logger.error({ err: error }, "Unexpected error");

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.NODE_ENV === "development" &&
      error instanceof Error && {
        stack: error.stack,
      }),
  });
};
