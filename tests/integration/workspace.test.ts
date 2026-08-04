import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { prisma } from "../../src/config/database.js";

const password = "Password123!";

const createAuthenticatedUser = async (name: string, email: string) => {
  await request(app)
    .post("/api/v1/auth/register")
    .send({
      name,
      email,
      password,
    })
    .expect(201);

  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  return {
    user,
    accessToken: loginResponse.body.data.result.tokens.accessToken as string,
  };
};

const createWorkspace = async (accessToken: string, name: string) => {
  await request(app)
    .post("/api/v1/workspaces")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name })
    .expect(201);

  return prisma.workspace.findFirstOrThrow({
    where: { name },
  });
};

describe("Workspace RBAC", () => {
  it("should create an OWNER membership with the workspace", async () => {
    const owner = await createAuthenticatedUser(
      "Workspace Owner",
      "owner@example.com",
    );

    const workspace = await createWorkspace(
      owner.accessToken,
      "Test Workspace",
    );

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: owner.user.id,
      },
    });

    expect(membership).not.toBeNull();
    expect(membership?.role).toBe("OWNER");
  });

  it("should prevent a MEMBER from updating the workspace", async () => {
    const owner = await createAuthenticatedUser("Owner", "owner@example.com");

    const member = await createAuthenticatedUser(
      "Member",
      "member@example.com",
    );

    const workspace = await createWorkspace(
      owner.accessToken,
      "Protected Workspace",
    );

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: member.user.id,
        role: "MEMBER",
      },
    });

    const response = await request(app)
      .patch(`/api/v1/workspaces/${workspace.id}`)
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({
        name: "Unauthorized Name",
      });

    expect(response.status).toBe(403);

    const unchangedWorkspace = await prisma.workspace.findUniqueOrThrow({
      where: { id: workspace.id },
    });

    expect(unchangedWorkspace.name).toBe("Protected Workspace");
  });

  it("should prevent a non-member from accessing the workspace", async () => {
    const owner = await createAuthenticatedUser("Owner", "owner@example.com");

    const outsider = await createAuthenticatedUser(
      "Outsider",
      "outsider@example.com",
    );

    const workspace = await createWorkspace(
      owner.accessToken,
      "Private Workspace",
    );

    const response = await request(app)
      .get(`/api/v1/workspaces/${workspace.id}`)
      .set("Authorization", `Bearer ${outsider.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
