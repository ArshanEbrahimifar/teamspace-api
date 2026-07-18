import type { RequestHandler } from "express";
import type { RegisterInput } from "./auth.schema.js";

export const register: RequestHandler = (_req, res) => {
  const { body } = res.locals.validatedData as { body: RegisterInput };

  res.status(201).json({
    success: true,
    message: "Register request is valid",
    data: {
      name: body.name,
      email: body.email,
    },
  });
};
