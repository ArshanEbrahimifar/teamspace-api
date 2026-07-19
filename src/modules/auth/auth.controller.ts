import type { RequestHandler } from "express";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";

export const register: RequestHandler = async (_req, res) => {
  const { body } = res.locals.validatedData as { body: RegisterInput };

  const result = await registerUser(body);
  res.status(201).json({
    success: true,
    message: "Account created successfuly",
    data: {
      result,
    },
  });
};
export const login: RequestHandler = async (_req, res) => {
  const { body } = res.locals.validatedData as { body: LoginInput };

  const result = await loginUser(body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      result,
    },
  });
};
