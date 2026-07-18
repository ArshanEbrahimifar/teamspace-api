import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { login, register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest(registerSchema), register);

authRouter.post("/login", validateRequest(loginSchema), login);
