import type { WorkspaceRole } from "../../generated/prisma/client.js";

export type WorkspaceRequestContext = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    memberCount: number;
  };

  membership: {
    id: string;
    role: WorkspaceRole;
    joinedAt: Date;
  };
};
