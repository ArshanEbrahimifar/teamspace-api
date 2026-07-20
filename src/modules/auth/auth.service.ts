import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import {
  createRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from "../../shared/utils/token.js";

import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
} from "./auth.schema.js";
import { env } from "../../config/env.js";
import type { SessionMetadata } from "./auth.types.js";

export const registerUser = async (
  input: RegisterInput,
  metadata: SessionMetadata,
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const refreshTokenData = createRefreshToken();

  const { user, session } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },

      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    const session = await tx.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshTokenData.tokenHash,
        expiresAt: refreshTokenData.expiresAt,

        ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),

        ...(metadata.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
      },

      select: {
        id: true,
      },
    });

    return {
      user,
      session,
    };
  });
  const accessToken = await signAccessToken(user.id, session.id);
  return {
    user,

    tokens: {
      accessToken,
      refreshToken: refreshTokenData.token,
      accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiresAt: refreshTokenData.expiresAt,
    },
  };
};
export const loginUser = async (
  input: LoginInput,
  metadata: SessionMetadata,
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }
  if (!user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }
  const isPasswordValid = await verifyPassword(
    user.passwordHash,
    input.password,
  );
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }
  const refreshTokenData = createRefreshToken();
  const { updatedUser, session } = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: user.id,
      },

      data: {
        lastLoginAt: new Date(),
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

    const session = await tx.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshTokenData.tokenHash,
        expiresAt: refreshTokenData.expiresAt,

        ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),

        ...(metadata.ipAddress ? { ipAddress: metadata.ipAddress } : {}),
      },

      select: {
        id: true,
      },
    });

    return {
      updatedUser,
      session,
    };
  });
  const accessToken = await signAccessToken(updatedUser.id, session.id);
  return {
    user: updatedUser,
    tokens: {
      accessToken,
      refreshToken: refreshTokenData.token,
      accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshTokenExpiresAt: refreshTokenData.expiresAt,
    },
  };
};

export const refreshAuthTokens = async (input: RefreshTokenInput) => {
  const currentTokenHash = hashRefreshToken(input.refreshToken);

  const session = await prisma.authSession.findUnique({
    where: {
      refreshTokenHash: currentTokenHash,
    },

    include: {
      user: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (!session.user.isActive) {
    throw new AppError("Your account is inactive", 403);
  }

  const newRefreshTokenData = createRefreshToken();

  const newAccessToken = await signAccessToken(session.user.id, session.id);

  const updateResult = await prisma.authSession.updateMany({
    where: {
      id: session.id,
      refreshTokenHash: currentTokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },

    data: {
      refreshTokenHash: newRefreshTokenData.tokenHash,

      expiresAt: newRefreshTokenData.expiresAt,
      lastRefreshedAt: new Date(),
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshTokenData.token,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresAt: newRefreshTokenData.expiresAt,
  };
};
export const logoutUser = async (input: RefreshTokenInput) => {
  const refreshTokenHash = hashRefreshToken(input.refreshToken);

  await prisma.authSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};
export const getActiveSessions = async (
  userId: string,
  currentSessionId: string,
) => {
  const sessions = await prisma.authSession.findMany({
    where: {
      userId,
      revokedAt: null,

      expiresAt: {
        gt: new Date(),
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
      lastRefreshedAt: true,
      createdAt: true,
    },
  });

  return sessions.map((session) => ({
    ...session,
    isCurrent: session.id === currentSessionId,
  }));
};
export const revokeUserSession = async (
  userId: string,
  sessionId: string,
): Promise<void> => {
  const result = await prisma.authSession.updateMany({
    where: {
      id: sessionId,
      userId,
      revokedAt: null,
    },

    data: {
      revokedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    throw new AppError("Session not found", 404);
  }
};
export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },

    data: {
      revokedAt: new Date(),
    },
  });
};
