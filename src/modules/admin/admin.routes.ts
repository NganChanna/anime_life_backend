import type { FastifyInstance } from "fastify";
import {
    updateRoleSchema,
    userIdParamsSchema,
    usersListResponseSchema,
    statsResponseSchema,
    messageResponseSchema,
} from "./admin.schema.js";
import {
    getStatsHandler,
    getUsersHandler,
    updateUserRoleHandler,
    deleteUserHandler,
} from "./admin.controller.js";

export async function adminRoutes(server: FastifyInstance) {
    // All admin routes require authentication + ADMIN role
    server.addHook("onRequest", server.authorizeAdmin);

    server.get("/stats", {
        schema: {
            response: { 200: statsResponseSchema },
            tags: ["Admin"],
            summary: "Get dashboard stats",
            security: [{ bearerAuth: [] }],
        },
        handler: getStatsHandler,
    });

    server.get("/users", {
        schema: {
            response: { 200: usersListResponseSchema },
            tags: ["Admin"],
            summary: "List all users",
            security: [{ bearerAuth: [] }],
        },
        handler: getUsersHandler,
    });

    server.patch("/users/:id/role", {
        schema: {
            params: userIdParamsSchema,
            body: updateRoleSchema,
            tags: ["Admin"],
            summary: "Update user role",
            security: [{ bearerAuth: [] }],
        },
        handler: updateUserRoleHandler,
    });

    server.delete("/users/:id", {
        schema: {
            params: userIdParamsSchema,
            response: { 200: messageResponseSchema },
            tags: ["Admin"],
            summary: "Delete a user",
            security: [{ bearerAuth: [] }],
        },
        handler: deleteUserHandler,
    });
}
