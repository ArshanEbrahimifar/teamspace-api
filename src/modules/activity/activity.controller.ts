import type { RequestHandler } from "express";

import { AppError } from "../../shared/errors/app-error.js";

import type { ListWorkspaceActivitiesQuery } from "./activity.schema.js";

import { getWorkspaceActivities } from "./activity.service.js";

export const listWorkspaceActivitiesHandler: RequestHandler = async (
  req,
  res,
) => {
  if (!req.workspaceContext) {
    throw new AppError("Workspace not found", 404);
  }

  const { query } = res.locals.validatedData as {
    query: ListWorkspaceActivitiesQuery;
  };

  const result = await getWorkspaceActivities(
    req.workspaceContext.workspace.id,
    query,
  );

  res.status(200).json({
    success: true,
    message: "Workspace activities retrieved successfully",

    data: {
      workspace: {
        id: req.workspaceContext.workspace.id,
        name: req.workspaceContext.workspace.name,
      },

      activities: result.activities,
      pagination: result.pagination,
    },
  });
};
