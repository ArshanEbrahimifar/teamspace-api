# Teamspace API

A modular, production-oriented REST API for collaborative workspace management, featuring secure session-based authentication, hierarchical RBAC, transactional activity logging, isolated integration testing, and automated CI.

## Overview

Teamspace API provides the backend foundation for a multi-user project-management platform.

```text
Workspace
└── Project
    └── Board
        └── Column
            └── Task
```

The API validates membership, role, and resource ownership across the complete hierarchy to prevent unauthorized cross-workspace access.

## Key Features

### Authentication

- User registration and login
- Argon2 password hashing
- Short-lived JWT access tokens
- Cryptographically random refresh tokens
- Hashed refresh-token storage
- Refresh-token rotation
- Revocable authentication sessions
- Session-bound access tokens
- Logout and current-user endpoints

### Workspace Collaboration

- Workspace creation and management
- Automatic OWNER membership for creators
- Role-based access control with OWNER, ADMIN, and MEMBER
- Membership management
- Ownership transfer
- Leave-workspace flow
- Invitation creation, acceptance, decline, revocation, and expiration
- Protection against duplicate memberships and pending invitations

### Project and Task Management

- Project CRUD with workspace-scoped keys
- Board and column management
- Column reordering
- Task creation, listing, retrieval, updates, and soft deletion
- Task movement within and across columns
- Full-column task reordering
- Pagination and filtering
- Nested resource validation

### Activity Logs

Important state changes generate structured workspace activity records.

Supported activity types include:

```text
WORKSPACE_CREATED
MEMBER_INVITED
PROJECT_CREATED
BOARD_CREATED
COLUMN_CREATED
TASK_CREATED
TASK_UPDATED
TASK_MOVED
TASK_DELETED
```

Activity logs support pagination and filtering by action, entity type, entity ID, and actor ID.

## Engineering Highlights

- Modular architecture organized around business capabilities
- Hierarchical authorization across workspace, project, board, column, and task boundaries
- Transactional consistency for sensitive multi-record operations
- Session-based authentication with refresh-token rotation and revocation
- Hashed token persistence instead of storing raw refresh tokens
- Soft deletion for entities that require historical continuity
- Centralized error handling with production-safe responses
- Structured logging with Pino
- Fail-fast environment validation with Zod
- Graceful shutdown for the HTTP server and Prisma client
- Isolated integration testing against a real PostgreSQL test database
- Automated CI quality gates with GitHub Actions

## Technology Stack

| Category       | Technology                               |
| -------------- | ---------------------------------------- |
| Runtime        | Node.js                                  |
| Language       | TypeScript                               |
| Framework      | Express                                  |
| Database       | PostgreSQL                               |
| ORM            | Prisma                                   |
| Validation     | Zod                                      |
| Authentication | jose, Argon2, Node.js Crypto             |
| Logging        | Pino                                     |
| Testing        | Vitest, Supertest                        |
| Documentation  | Swagger UI, Swagger JSDoc, OpenAPI 3.0.3 |
| Security       | Helmet, CORS, Express Rate Limit         |
| Infrastructure | Docker, Docker Compose                   |
| CI             | GitHub Actions                           |

## Architecture

```text
Client
  │
  ▼
Security Middleware
  │
  ▼
Authentication
  │
  ▼
Request Validation
  │
  ▼
Workspace RBAC
  │
  ▼
Controllers and Services
  │
  ▼
Prisma Transactions
  │
  ▼
PostgreSQL
```

## Project Structure

```text
teamspace-api/
├── .github/workflows/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── generated/prisma/
│   ├── middleware/
│   ├── modules/
│   │   ├── activity/
│   │   ├── auth/
│   │   ├── board/
│   │   ├── board-column/
│   │   ├── invitation/
│   │   ├── project/
│   │   ├── task/
│   │   └── workspace/
│   ├── shared/
|   |   |__errors/
|   |   |__utils/
|   |
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── helpers/
│   ├── integration/
│   └── setup.ts
├── docker-compose.yml
├── vitest.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 24.x
- npm
- Docker Desktop
- Git

### Setup

```bash
git clone https://github.com/ArshanEbrahimifar/teamspace-api.git
cd teamspace-api

npm ci
```

Create the local environment file:

```bash
cp .env.example .env
```

PowerShell:

```powershel
Copy-Item .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Prepare the database:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start the API:

```bash
npm run dev
```

Local URLs:

```text
API:      http://localhost:5000
Health:   http://localhost:5000/health
Swagger:  http://localhost:5000/api-docs
```

## Docker

Docker Compose provides an isolated PostgreSQL development environment.

```text
Host machine
├── Node.js / Express API
└── Docker
    └── PostgreSQL
```

Common commands:

```bash
docker compose up -d
docker compose ps
docker compose logs -f
docker compose stop
docker compose down
```

> docker compose down -v also removes persistent database volumes.

## Environment Variables

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_ISSUER=teamspace-api
JWT_AUDIENCE=teamspace-client

REFRESH_TOKEN_EXPIRES_IN_DAYS=7
WORKSPACE_INVITATION_EXPIRES_IN_DAYS=7

CORS_ORIGINS=http://localhost:5173
```

## Available Scripts

| Command                  | Description                           |
| ------------------------ | ------------------------------------- |
| npm run dev              | Start the development server          |
| npm run build            | Compile TypeScript                    |
| npm start                | Start the compiled application        |
| npm run lint             | Run ESLint                            |
| npm run type-check       | Validate TypeScript types             |
| npm run test:integration | Run integration tests                 |
| npm run db:test:migrate  | Apply migrations to the test database |

Run the complete local quality gate:

```bash
npm run lint
npm run type-check
npm run test:integration
npm run build
```

## API Documentation

Interactive OpenAPI documentation is available at:

```text
http://localhost:5000/api-docs
```

Swagger includes representative operations for authentication, workspaces, invitations, projects, boards, tasks, and activity logs.

Protected endpoints use the bearerAuth security scheme.

## Testing Strategy

Integration tests use:

- Vitest
- Supertest
- Prisma
- The real Express application
- A dedicated PostgreSQL test database
- Automatic database cleanup before each test

The suite focuses on high-value behavior rather than repetitive route coverage.

Covered scenarios include:

- Registration and duplicate-email protection
- Login and invalid credentials
- Protected-route authentication
- Refresh-token rotation
- Rejection of reused refresh tokens
- Logout and session revocation
- Workspace ownership and RBAC
- Invitation creation and acceptance
- Task movement and reordering
- Task soft deletion
- Activity-log persistence

Run the integration suite:

```bash
npm run db:test:migrate
npm run test:integration
```

## Security

Implemented controls include:

- Argon2 password hashing
- Short-lived JWT access tokens
- Hashed refresh-token storage
- Refresh-token rotation
- Revocable authentication sessions
- Session-bound access tokens
- Zod request validation
- Workspace RBAC
- Nested resource ownership checks
- Helmet security headers
- Configurable CORS allowlist
- API and authentication rate limiting
- JSON body-size limits
- Production-safe error responses
- Environment and secret validation
- Trusted-proxy support

## Continuous Integration

GitHub Actions runs on pushes and pull requests targeting main.

The workflow:

```text
Starts temporary PostgreSQL
Installs dependencies
Generates Prisma Client
Applies migrations
Runs ESLint
Runs TypeScript checks
Runs integration tests
Builds the application
```

A successful workflow confirms that the project installs, migrates, tests, and builds correctly in a clean environment.

## Project Status

**Release target:** `v1.0.0`

The core backend scope is complete, including authentication, session management, RBAC, invitations, projects, boards, columns, tasks, activity logging, integration tests, OpenAPI documentation, security hardening, Docker-based PostgreSQL, and GitHub Actions CI.

Deployment is intentionally outside the current scope.

## Roadmap

- Task comments
- File attachments
- Task labels
- Notifications
- Advanced search and filtering
- Password reset and email verification
- Redis-backed distributed rate limiting
- Application containerization
- Production deployment and monitoring

## Author

**Arshan Ebrahimifar**

- GitHub: [ArshanEbrahimifar](https://github.com/ArshanEbrahimifar)
- Repository: [teamspace-api](https://github.com/ArshanEbrahimifar/teamspace-api)
