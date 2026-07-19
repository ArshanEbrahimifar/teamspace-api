import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from "./auth.schema.js";
import { login, logout, refresh, register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest(registerSchema), register);

authRouter.post("/login", validateRequest(loginSchema), login);

authRouter.post("/refresh", validateRequest(refreshTokenSchema), refresh);

authRouter.post("/logout", validateRequest(refreshTokenSchema), logout);
