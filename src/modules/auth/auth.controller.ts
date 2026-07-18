import type { RequestHandler } from "express";
import type { RegisterInput } from "./auth.schema.js";
import { registerUser } from "./auth.service.js";

export const register: RequestHandler = async (_req, res) => {
  const { body } = res.locals.validatedData as { body: RegisterInput };

  const user = await registerUser(body);
  res.status(201).json({
    success: true,
    message: "Register request is valid",
    data: {
      user,
    },
  });
};
