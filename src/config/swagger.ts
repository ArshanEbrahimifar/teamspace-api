import swaggerJSDoc from "swagger-jsdoc";
import type { Options } from "swagger-jsdoc";

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Teamspace API",
      version: "1.0.0",
      description:
        "REST API for managing workspaces, projects, boards, columns, tasks, invitations, and activities.",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Auth",
        description: "Authentication and session management",
      },
      {
        name: "Workspaces",
        description: "Workspace and member management",
      },
      {
        name: "Invitations",
        description: "Workspace invitation management",
      },
      {
        name: "Projects",
        description: "Project management",
      },
      {
        name: "Boards",
        description: "Board and column management",
      },
      {
        name: "Tasks",
        description: "Task management",
      },
      {
        name: "Activities",
        description: "Workspace activity logs",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Something went wrong",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },

        User: {
          type: "object",
          required: ["id", "name", "email", "createdAt", "updatedAt"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Arshan Ebrahimifar",
            },
            email: {
              type: "string",
              format: "email",
              example: "arshan@example.com",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        AuthTokens: {
          type: "object",
          required: ["accessToken", "refreshToken"],
          properties: {
            accessToken: {
              type: "string",
              description: "Short-lived JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "Refresh token used to rotate the session",
            },
          },
        },

        PaginationMeta: {
          type: "object",
          required: ["page", "limit", "total", "totalPages"],
          properties: {
            page: {
              type: "integer",
              minimum: 1,
              example: 1,
            },
            limit: {
              type: "integer",
              minimum: 1,
              example: 20,
            },
            total: {
              type: "integer",
              minimum: 0,
              example: 42,
            },
            totalPages: {
              type: "integer",
              minimum: 0,
              example: 3,
            },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.ts", "./dist/modules/**/*.routes.js"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
