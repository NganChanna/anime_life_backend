import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { envConfig } from "../../config/env-config.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { clerkWebhookHeadersSchema } from "./clerk.schema.js";
import type { ClerkWebhookHeaders } from "./clerk.schema.js";

export const handleWebhook = async (server: FastifyInstance) => {
    server.post("/clerk", {
        schema: {
            headers: clerkWebhookHeadersSchema,
        }
    }, async (request: FastifyRequest<{ Headers: ClerkWebhookHeaders }>, reply: FastifyReply) => {
        const webhook = new Webhook(envConfig.CLERK_WEBHOOK_SECRET);
        let evt: WebhookEvent;
        if (!envConfig.CLERK_WEBHOOK_SECRET) {
            throw new Error("Webhook secret is not defined");
        }


        /**
         * * Get the header for verifycation
         */
        try {
            evt = webhook.verify(request.body as string, {
                'svix-id': request.headers['svix-id'],
                'svix-timestamp': request.headers['svix-timestamp'],
                'svix-signature': request.headers['svix-signature'],
            }) as WebhookEvent;
        } catch (error) {
            return reply.status(400).send({ error: "Invalid webhook signature" });
        }

        /**
         * * Handle the webhook event
         */
        if (evt.type === "user.created") {
            const { id, email_addresses, first_name, last_name, image_url } = evt.data;
            const email = email_addresses[0]?.email_address;
            const name = [first_name, last_name].filter(Boolean).join(" ") || email?.split("@")[0] || id;
            const avatar = image_url;

            if (!email) {
                return reply.status(400).send({ error: "Email is not defined" });
            }

            const user = await request.server.prisma.user.create({
                data: {
                    id,
                    email,
                    username: name,
                    avatar,
                },
            });

            return reply.status(200).send({ user });
        }
    })
}