import type { RequestHandler } from "express";

import { prisma } from "../config/database.js";
import { AppError } from "../shared/errors/app-error.js";
import { verifyAccessToken } from "../shared/utils/token.js";

const validateAccessToken = async (
  token: string,
): Promise<{ userId: string; sessionId: string }> => {
  try {
    return await verifyAccessToken(token);
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    throw new AppError("Authentication is required", 401);
  }

  const parts = authorizationHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer" || !parts[1]) {
    throw new AppError("Invalid authorization header", 401);
  }

  const accessToken = parts[1];

  const { userId, sessionId } = await validateAccessToken(accessToken);

  const session = await prisma.authSession.findUnique({
    where: {
      id: sessionId,
    },

    select: {
      userId: true,
      expiresAt: true,
      revokedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (
    !session ||
    session.userId !== userId ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new AppError("Invalid or expired access token", 401);
  }

  if (!session.user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  req.auth = {
    user: session.user,
    sessionId,
  };

  next();
};
