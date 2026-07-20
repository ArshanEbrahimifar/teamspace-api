export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};
