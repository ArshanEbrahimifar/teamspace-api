import { prisma } from "../../config/database.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hashPassword } from "../../shared/utils/password.js";

import type { RegisterInput } from "./auth.schema.js";

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
