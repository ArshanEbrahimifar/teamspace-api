import type { RequestHandler } from "express";

import { prisma } from "../config/database.js";
import { AppError } from "../shared/errors/app-error.js";
import { verifyAccessToken } from "../shared/utils/token.js";

const validateAccessToken = async (
  token: string,
): Promise<{ userId: string }> => {
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

  const { userId } = await validateAccessToken(accessToken);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired access token", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  req.auth = {
    user,
  };

  next();
};
