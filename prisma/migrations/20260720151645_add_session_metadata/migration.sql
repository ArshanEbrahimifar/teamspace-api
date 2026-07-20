-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastRefreshedAt" TIMESTAMP(3),
ADD COLUMN     "userAgent" TEXT;
