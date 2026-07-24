import { z } from "zod";

export const acceptWorkspaceInvitationSchema = z.object({
  body: z
    .object({
      token: z
        .string()
        .trim()
        .min(1, "Invitation token is required")
        .max(500, "Invitation token is invalid"),
    })
    .strict(),
});

export type AcceptWorkspaceInvitationInput = z.infer<
  typeof acceptWorkspaceInvitationSchema
>["body"];
