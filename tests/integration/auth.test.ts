import app from "../../src/app.js";
import { describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../../src/config/database.js";

const testUserInput = {
  name: "Test User",
  email: "login@example.com",
  password: "Password123!",
};

const registerTestUser = async () => {
  return request(app).post("/api/v1/auth/register").send(testUserInput);
};

const loginTestUser = async () => {
  await registerTestUser();
  const response = await request(app).post("/api/v1/auth/login").send({
    email: testUserInput.email,
    password: testUserInput.password,
  });
  expect(response.status).toBe(200);

  return response.body.data.result.tokens as {
    accessToken: string;
    refreshToken: string;
  };
};

describe("POST /api/v1/auth/register", () => {
  it("should register a new user", async () => {
    const registerInput = {
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerInput);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    const createdUser = await prisma.user.findUnique({
      where: {
        email: registerInput.email,
      },
    });

    expect(createdUser).not.toBeNull();
    expect(createdUser?.name).toBe(registerInput.name);
    expect(createdUser?.email).toBe(registerInput.email);

    expect(createdUser?.passwordHash).not.toBe(registerInput.password);
  });

  it("should reject a duplicate email", async () => {
    const registerInput = {
      name: "Test User",
      email: "duplicate@example.com",
      password: "Password123!",
    };

    const firstResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(registerInput);

    const secondResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(registerInput);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(409);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("should log in with valid credentials", async () => {
    await registerTestUser();

    const response = await request(app).post("/api/v1/auth/login").send({
      email: testUserInput.email,
      password: testUserInput.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.result.tokens.accessToken).toEqual(
      expect.any(String),
    );

    expect(response.body.data.result.tokens.refreshToken).toEqual(
      expect.any(String),
    );
  });

  it("should reject an invalid password", async () => {
    await registerTestUser();

    const response = await request(app).post("/api/v1/auth/login").send({
      email: testUserInput.email,
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject an unregistered email", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "unknown@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("should return the authenticated user", async () => {
    await registerTestUser();

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: testUserInput.email,
      password: testUserInput.password,
    });

    expect(loginResponse.status).toBe(200);

    const accessToken: string =
      loginResponse.body.data.result.tokens.accessToken;

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.user.email).toBe(testUserInput.email);

    expect(response.body.data.user.name).toBe(testUserInput.name);
  });

  it("should reject an invalid access token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-access-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("should rotate the refresh token", async () => {
    const oldTokens = await loginTestUser();

    const response = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: oldTokens.refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const newTokens = response.body.data.tokens;

    expect(newTokens.accessToken).toEqual(expect.any(String));

    expect(newTokens.refreshToken).toEqual(expect.any(String));

    expect(newTokens.refreshToken).not.toBe(oldTokens.refreshToken);
  });

  it("should reject a rotated refresh token", async () => {
    const oldTokens = await loginTestUser();

    const firstRefreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: oldTokens.refreshToken,
      });

    expect(firstRefreshResponse.status).toBe(200);

    const reusedTokenResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: oldTokens.refreshToken,
      });

    expect(reusedTokenResponse.status).toBe(401);

    expect(reusedTokenResponse.body.success).toBe(false);
  });

  it("should accept the newly rotated refresh token", async () => {
    const oldTokens = await loginTestUser();

    const firstRefreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: oldTokens.refreshToken,
      });

    expect(firstRefreshResponse.status).toBe(200);

    const newRefreshToken: string =
      firstRefreshResponse.body.data.tokens.refreshToken;

    const secondRefreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({
        refreshToken: newRefreshToken,
      });

    expect(secondRefreshResponse.status).toBe(200);

    expect(secondRefreshResponse.body.success).toBe(true);

    expect(secondRefreshResponse.body.data.tokens.refreshToken).not.toBe(
      newRefreshToken,
    );
  });

  it("should reject an invalid refresh token", async () => {
    const response = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: "invalid-refresh-token",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
