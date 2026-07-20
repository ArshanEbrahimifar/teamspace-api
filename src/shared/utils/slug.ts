import { randomBytes } from "node:crypto";

export const generateWorkspaceSlug = (name: string): string => {
  const normalizedName = name
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const baseSlug = normalizedName.length > 0 ? normalizedName : "workspace";

  const randomSuffix = randomBytes(3).toString("hex");

  return `${baseSlug}-${randomSuffix}`;
};
