import type { FastifyInstance } from "fastify";
import {
    paramsWithIdSchema,
    createConversationSchema,
    sendMessageSchema,
    chatHistoryQuerySchema,
    conversationResponseSchema,
    conversationListResponseSchema,
    messageListResponseSchema,
    messageResponseSchema,
} from "./chat.schema.js";
import {
    createConversationHandler,
    listConversationsHandler,
    getChatHistoryHandler,
    sendMessageHandler,
} from "./chat.controller.js";

export async function chatRoutes(server: FastifyInstance) {
    // All chat routes require authentication
    server.addHook("onRequest", server.authenticate);

    server.post("/conversation", {
        schema: {
            body: createConversationSchema,
            response: { 201: conversationResponseSchema },
            tags: ["Chat"],
            summary: "Create a conversation",
            description: "Create a new DM or group conversation",
            security: [{ bearerAuth: [] }],
        },
        handler: createConversationHandler,
    });

    server.get("/conversations", {
        schema: {
            response: { 200: conversationListResponseSchema },
            tags: ["Chat"],
            summary: "List conversations",
            description: "List all conversations the user is a member of",
            security: [{ bearerAuth: [] }],
        },
        handler: listConversationsHandler,
    });

    server.get("/conversation/:id/messages", {
        schema: {
            params: paramsWithIdSchema,
            querystring: chatHistoryQuerySchema,
            response: { 200: messageListResponseSchema },
            tags: ["Chat"],
            summary: "Get chat history",
            description: "Get paginated message history for a conversation",
            security: [{ bearerAuth: [] }],
        },
        handler: getChatHistoryHandler,
    });

    server.post("/conversation/:id/message", {
        schema: {
            params: paramsWithIdSchema,
            body: sendMessageSchema,
            response: { 201: messageResponseSchema },
            tags: ["Chat"],
            summary: "Send a message",
            description: "Send a message in a conversation (also broadcasts via WebSocket)",
            security: [{ bearerAuth: [] }],
        },
        handler: sendMessageHandler,
    });
}
