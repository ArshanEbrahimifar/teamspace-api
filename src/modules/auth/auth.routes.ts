import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import { registerSchema } from "./auth.schema.js";
import { register } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest(registerSchema), register);
