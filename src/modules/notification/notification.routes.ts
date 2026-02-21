import type { FastifyInstance } from "fastify";
import {
    paramsWithIdSchema,
    notificationQuerySchema,
    notificationListResponseSchema,
    genericMessageSchema,
} from "./notification.schema.js";
import {
    listNotificationsHandler,
    markAsReadHandler,
    markAllAsReadHandler,
    deleteNotificationHandler,
} from "./notification.controller.js";

export async function notificationRoutes(server: FastifyInstance) {
    // All notification routes require authentication
    server.addHook("onRequest", server.authenticate);

    server.get("/", {
        schema: {
            querystring: notificationQuerySchema,
            response: { 200: notificationListResponseSchema },
            tags: ["Notifications"],
            summary: "List notifications",
            description: "Get paginated notifications, unread first. Use ?unreadOnly=true to filter.",
            security: [{ bearerAuth: [] }],
        },
        handler: listNotificationsHandler,
    });

    server.patch("/:id/read", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: genericMessageSchema },
            tags: ["Notifications"],
            summary: "Mark notification as read",
            description: "Mark a specific notification as read",
            security: [{ bearerAuth: [] }],
        },
        handler: markAsReadHandler,
    });

    server.patch("/read-all", {
        schema: {
            response: { 200: genericMessageSchema },
            tags: ["Notifications"],
            summary: "Mark all as read",
            description: "Mark all of the user's unread notifications as read",
            security: [{ bearerAuth: [] }],
        },
        handler: markAllAsReadHandler,
    });

    server.delete("/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: genericMessageSchema },
            tags: ["Notifications"],
            summary: "Delete notification",
            description: "Delete a specific notification",
            security: [{ bearerAuth: [] }],
        },
        handler: deleteNotificationHandler,
    });
}
