import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const clerkWebhookHeadersSchema = Type.Object({
    "svix-id": Type.String(),
    "svix-timestamp": Type.String(),
    "svix-signature": Type.String(),
});

export type ClerkWebhookHeaders = Static<typeof clerkWebhookHeadersSchema>;
