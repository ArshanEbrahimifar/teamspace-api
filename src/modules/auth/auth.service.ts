import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";

import type { LoginInput, RegisterInput } from "./auth.schema.js";

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

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
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

  return user;
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
  const updatedUser = await prisma.user.update({
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
  return updatedUser;
};
