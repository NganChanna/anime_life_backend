import type { FastifyInstance } from "fastify";
import {
    paramsWithIdSchema,
    userProfileResponseSchema,
    followListResponseSchema,
    watchlistResponseSchema,
    messageResponseSchema,
} from "./user.schema.js";
import {
    getUserProfileHandler,
    getFollowersHandler,
    getFollowingHandler,
    followUserHandler,
    unfollowUserHandler,
    getUserWatchlistHandler,
} from "./user.controller.js";

export async function userRoutes(server: FastifyInstance) {
    // ── Public routes ──

    server.get("/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: userProfileResponseSchema },
            tags: ["Users"],
            summary: "Get user profile",
            description: "Get a user's public profile with follower/following counts",
        },
        handler: getUserProfileHandler,
    });

    server.get("/:id/followers", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: followListResponseSchema },
            tags: ["Users"],
            summary: "Get user's followers",
            description: "List all users who follow this user",
        },
        handler: getFollowersHandler,
    });

    server.get("/:id/following", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: followListResponseSchema },
            tags: ["Users"],
            summary: "Get user's following",
            description: "List all users this user is following",
        },
        handler: getFollowingHandler,
    });

    server.get("/:id/watchlist", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: watchlistResponseSchema },
            tags: ["Users"],
            summary: "Get user's watchlist",
            description: "Get a user's anime watchlist with progress",
        },
        handler: getUserWatchlistHandler,
    });

    // ── Protected routes (JWT required) ──

    server.register(async function protectedRoutes(protectedServer) {
        protectedServer.addHook("onRequest", server.authenticate);

        protectedServer.post("/:id/follow", {
            schema: {
                params: paramsWithIdSchema,
                response: { 200: messageResponseSchema },
                tags: ["Users"],
                summary: "Follow a user",
                description: "Follow the specified user (requires authentication)",
                security: [{ bearerAuth: [] }],
            },
            handler: followUserHandler,
        });

        protectedServer.delete("/:id/follow", {
            schema: {
                params: paramsWithIdSchema,
                response: { 200: messageResponseSchema },
                tags: ["Users"],
                summary: "Unfollow a user",
                description: "Unfollow the specified user (requires authentication)",
                security: [{ bearerAuth: [] }],
            },
            handler: unfollowUserHandler,
        });
    });
}
