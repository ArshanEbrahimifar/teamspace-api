import { createHash, randomBytes } from "node:crypto";
import { TextEncoder } from "node:util";

import { jwtVerify, SignJWT } from "jose";

import { env } from "../../config/env.js";

const accessTokenSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

const accessTokenAlgorithm = "HS256";

export const signAccessToken = async (userId: string): Promise<string> => {
  return new SignJWT({
    tokenType: "access",
  })
    .setProtectedHeader({
      alg: accessTokenAlgorithm,
      typ: "JWT",
    })
    .setSubject(userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(accessTokenSecret);
};

export const verifyAccessToken = async (
  token: string,
): Promise<{ userId: string }> => {
  const { payload } = await jwtVerify(token, accessTokenSecret, {
    algorithms: [accessTokenAlgorithm],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (payload.tokenType !== "access" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: payload.sub,
  };
};

export const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

type RefreshTokenData = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

export const createRefreshToken = (): RefreshTokenData => {
  const token = randomBytes(64).toString("base64url");

  const tokenHash = hashRefreshToken(token);

  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    token,
    tokenHash,
    expiresAt,
  };
};
