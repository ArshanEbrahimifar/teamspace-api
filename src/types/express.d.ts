import type { AuthenticatedUser } from "../modules/auth/auth.types.ts";
import type { WorkspaceRequestContext } from "../modules/workspace/workspace.types.ts";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      user: AuthenticatedUser;
      sessionId: string;
    };
    workspaceContext?: WorkspaceRequestContext;
  }
}
