import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { prisma } from "../../src/config/database.js";
import { hashInvitationToken } from "../../src/shared/utils/invitation-token.js";

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

const createWorkspace = async (accessToken: string) => {
  await request(app)
    .post("/api/v1/workspaces")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Invitation Workspace",
    })
    .expect(201);

  return prisma.workspace.findFirstOrThrow({
    where: {
      name: "Invitation Workspace",
    },
  });
};

describe("Workspace invitations", () => {
  it("should allow the OWNER to create an invitation", async () => {
    const owner = await createAuthenticatedUser(
      "Invitation Owner",
      "owner@example.com",
    );

    const workspace = await createWorkspace(owner.accessToken);

    const response = await request(app)
      .post(`/api/v1/workspaces/${workspace.id}/invitations`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        email: "invited@example.com",
        role: "MEMBER",
      });

    expect(response.status).toBe(201);

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: workspace.id,
        email: "invited@example.com",
      },
    });

    expect(invitation).not.toBeNull();
    expect(invitation?.status).toBe("PENDING");
    expect(invitation?.role).toBe("MEMBER");
    expect(invitation?.invitedById).toBe(owner.user.id);
  });

  it("should add the invited user as a workspace member", async () => {
    const owner = await createAuthenticatedUser(
      "Invitation Owner",
      "owner@example.com",
    );

    const invitedUser = await createAuthenticatedUser(
      "Invited User",
      "invited@example.com",
    );

    const workspace = await createWorkspace(owner.accessToken);

    const rawToken = "a".repeat(64);

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId: workspace.id,
        invitedById: owner.user.id,
        email: invitedUser.user.email,
        role: "MEMBER",
        status: "PENDING",
        tokenHash: hashInvitationToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app)
      .post("/api/v1/invitations/accept")
      .set("Authorization", `Bearer ${invitedUser.accessToken}`)
      .send({
        token: rawToken,
      });

    expect(response.status).toBe(200);

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: invitedUser.user.id,
      },
    });

    expect(membership).not.toBeNull();
    expect(membership?.role).toBe("MEMBER");

    const acceptedInvitation =
      await prisma.workspaceInvitation.findUniqueOrThrow({
        where: {
          id: invitation.id,
        },
      });

    expect(acceptedInvitation.status).toBe("ACCEPTED");

    expect(acceptedInvitation.acceptedAt).not.toBeNull();
  });
});
