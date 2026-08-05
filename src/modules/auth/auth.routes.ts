import { Router } from "express";
import { validateRequest } from "../../middleware/validate-request.middleware.js";
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  sessionIdParamsSchema,
} from "./auth.schema.js";
import {
  getMe,
  listSessions,
  login,
  logout,
  logoutAllSessions,
  refresh,
  register,
  revokeSession,
} from "./auth.controller.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { authRateLimiter } from "../../config/rate-limit.js";

export const authRouter = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Test User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       409:
 *         description: Email is already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

authRouter.post(
  "/register",
  authRateLimiter,
  validateRequest(registerSchema),
  register,
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log in to an existing account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: "#/components/schemas/User"
 *                     tokens:
 *                       $ref: "#/components/schemas/AuthTokens"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

authRouter.post("/login", authRateLimiter, validateRequest(loginSchema), login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Rotate the refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens rotated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: "#/components/schemas/AuthTokens"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Invalid, expired, or revoked refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

authRouter.post("/refresh", validateRequest(refreshTokenSchema), refresh);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log out and revoke the current session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: Session revoked successfully
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

authRouter.post("/logout", validateRequest(refreshTokenSchema), logout);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: "#/components/schemas/User"
 *       401:
 *         description: Access token is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

authRouter.get("/me", authenticate, getMe);

authRouter.get("/sessions", authenticate, listSessions);

authRouter.delete(
  "/sessions/:sessionId",
  authenticate,
  validateRequest(sessionIdParamsSchema),
  revokeSession,
);

authRouter.delete("/sessions", authenticate, logoutAllSessions);
