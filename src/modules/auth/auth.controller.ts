import type { Request, RequestHandler } from "express";
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  SessionIdParams,
} from "./auth.schema.js";
import {
  loginUser,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  getActiveSessions,
  revokeUserSession,
  revokeAllUserSessions,
} from "./auth.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { SessionMetadata } from "./auth.types.js";

const getSessionMetadata = (req: Request): SessionMetadata => {
  const userAgent = req.get("user-agent");

  return {
    ...(userAgent ? { userAgent } : {}),
    ...(req.ip ? { ipAddress: req.ip } : {}),
  };
};

export const register: RequestHandler = async (req, res) => {
  const { body } = res.locals.validatedData as { body: RegisterInput };

  const result = await registerUser(body, getSessionMetadata(req));
  res.status(201).json({
    success: true,
    message: "Account created successfuly",
    data: {
      result,
    },
  });
};
export const login: RequestHandler = async (req, res) => {
  const { body } = res.locals.validatedData as { body: LoginInput };

  const result = await loginUser(body, getSessionMetadata(req));

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      result,
    },
  });
};
export const refresh: RequestHandler = async (_req, res) => {
  const { body } = res.locals.validatedData as { body: RefreshTokenInput };

  const tokens = await refreshAuthTokens(body);

  res.status(200).json({
    success: true,
    message: "Tokens refreshed successfully",
    data: {
      tokens,
    },
  });
};
export const logout: RequestHandler = async (_req, res) => {
  const { body } = res.locals.validatedData as { body: RefreshTokenInput };

  await logoutUser(body);

  res.status(204).send();
};

export const getMe: RequestHandler = (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }

  res.status(200).json({
    success: true,
    message: "Current user retrieved successfully",
    data: {
      user: req.auth.user,
    },
  });
};
export const listSessions: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }

  const sessions = await getActiveSessions(
    req.auth.user.id,
    req.auth.sessionId,
  );

  res.status(200).json({
    success: true,
    message: "Active sessions retrieved successfully",
    data: {
      sessions,
    },
  });
};
export const revokeSession: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }

  const { params } = res.locals.validatedData as {
    params: SessionIdParams;
  };

  await revokeUserSession(req.auth.user.id, params.sessionId);

  res.status(204).send();
};
export const logoutAllSessions: RequestHandler = async (req, res) => {
  if (!req.auth) {
    throw new AppError("Authentication is required", 401);
  }

  await revokeAllUserSessions(req.auth.user.id);

  res.status(204).send();
};
