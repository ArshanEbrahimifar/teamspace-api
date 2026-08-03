import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../src/app.js";

describe("Application", () => {
  it("should reject access to a protected route without an access token", async () => {
    const response = await request(app).get("/api/v1/auth/me");
    expect(response.status).toBe(401);
  });
});
