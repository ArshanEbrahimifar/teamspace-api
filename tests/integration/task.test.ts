import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../../src/app.js";
import { prisma } from "../../src/config/database.js";

const password = "Password123!";

const createAuthenticatedUser = async () => {
  const input = {
    name: "Task Test User",
    email: "task@example.com",
    password,
  };

  await request(app).post("/api/v1/auth/register").send(input).expect(201);

  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: input.email,
      password: input.password,
    })
    .expect(200);

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      email: input.email,
    },
  });

  return {
    user,
    accessToken: loginResponse.body.data.result.tokens.accessToken as string,
  };
};

const createTaskFixture = async () => {
  const { user, accessToken } = await createAuthenticatedUser();

  await request(app)
    .post("/api/v1/workspaces")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Task Test Workspace",
    })
    .expect(201);

  const workspace = await prisma.workspace.findFirstOrThrow({
    where: {
      name: "Task Test Workspace",
    },
  });

  await request(app)
    .post(`/api/v1/workspaces/${workspace.id}/projects`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Task Test Project",
      key: "TST",
    })
    .expect(201);

  const project = await prisma.project.findFirstOrThrow({
    where: {
      workspaceId: workspace.id,
      key: "TST",
    },
  });

  await request(app)
    .post(`/api/v1/workspaces/${workspace.id}/projects/${project.id}/boards`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "Task Test Board",
    })
    .expect(201);

  const board = await prisma.board.findFirstOrThrow({
    where: {
      projectId: project.id,
      name: "Task Test Board",
    },
  });

  const createColumn = async (name: string) => {
    await request(app)
      .post(
        `/api/v1/workspaces/${workspace.id}/projects/${project.id}/boards/${board.id}/columns`,
      )
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name })
      .expect(201);

    return prisma.boardColumn.findFirstOrThrow({
      where: {
        boardId: board.id,
        name,
      },
    });
  };

  const sourceColumn = await createColumn("To Do");

  const targetColumn = await createColumn("In Progress");

  const createTask = async (columnId: string, title: string) => {
    await request(app)
      .post(
        `/api/v1/workspaces/${workspace.id}/projects/${project.id}/boards/${board.id}/columns/${columnId}/tasks`,
      )
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title })
      .expect(201);

    return prisma.task.findFirstOrThrow({
      where: {
        columnId,
        title,
        deletedAt: null,
      },
    });
  };

  return {
    user,
    accessToken,
    workspace,
    project,
    board,
    sourceColumn,
    targetColumn,
    createTask,
  };
};

describe("Task move and reorder", () => {
  it("should move a task to another column", async () => {
    const fixture = await createTaskFixture();

    const task = await fixture.createTask(
      fixture.sourceColumn.id,
      "Move this task",
    );

    const response = await request(app)
      .patch(
        `/api/v1/workspaces/${fixture.workspace.id}/projects/${fixture.project.id}/boards/${fixture.board.id}/tasks/${task.id}/move`,
      )
      .set("Authorization", `Bearer ${fixture.accessToken}`)
      .send({
        targetColumnId: fixture.targetColumn.id,
        targetPosition: 0,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const movedTask = await prisma.task.findUniqueOrThrow({
      where: {
        id: task.id,
      },
    });

    expect(movedTask.columnId).toBe(fixture.targetColumn.id);

    expect(movedTask.position).toBe(0);
  });

  it("should reorder all tasks in a column", async () => {
    const fixture = await createTaskFixture();

    const firstTask = await fixture.createTask(
      fixture.sourceColumn.id,
      "First task",
    );

    const secondTask = await fixture.createTask(
      fixture.sourceColumn.id,
      "Second task",
    );

    const thirdTask = await fixture.createTask(
      fixture.sourceColumn.id,
      "Third task",
    );

    const reorderedTaskIds = [thirdTask.id, firstTask.id, secondTask.id];

    const response = await request(app)
      .patch(
        `/api/v1/workspaces/${fixture.workspace.id}/projects/${fixture.project.id}/boards/${fixture.board.id}/columns/${fixture.sourceColumn.id}/tasks/reorder`,
      )
      .set("Authorization", `Bearer ${fixture.accessToken}`)
      .send({
        taskIds: reorderedTaskIds,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const tasks = await prisma.task.findMany({
      where: {
        columnId: fixture.sourceColumn.id,
        deletedAt: null,
      },
      orderBy: {
        position: "asc",
      },
      select: {
        id: true,
      },
    });

    expect(tasks.map((task) => task.id)).toEqual(reorderedTaskIds);
  });
});
