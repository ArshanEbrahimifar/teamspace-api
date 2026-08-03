import app from "../../src/app.js";
import { describe, it, expect } from "vitest";
import request from "supertest";
import { prisma } from "../../src/config/database.js";

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
