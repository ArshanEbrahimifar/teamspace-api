import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import {
  createRefreshToken,
  signAccessToken,
} from "../../shared/utils/token.js";

import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { env } from "../../config/env.js";

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password } = input;

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);
  const refreshTokenData = createRefreshToken();
  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      passwordHash,
      authSessions: {
        create: {
          refreshTokenHash: refreshTokenData.tokenHash,
          expiresAt: refreshTokenData.expiresAt,
        },
      },
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
  const accessToken = await signAccessToken(user.id);
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
export const loginUser = async (input: LoginInput) => {
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
  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),

      authSessions: {
        create: {
          refreshTokenHash: refreshTokenData.tokenHash,
          expiresAt: refreshTokenData.expiresAt,
        },
      },
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
  const accessToken = await signAccessToken(updatedUser.id);
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
