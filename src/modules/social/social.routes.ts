import type { FastifyInstance } from "fastify";
import {
    paramsWithIdSchema,
    createPostSchema,
    postListQuerySchema,
    createCommentSchema,
    postResponseSchema,
    postListResponseSchema,
    commentResponseSchema,
    followListResponseSchema,
    messageResponseSchema,
    toggleResponseSchema,
} from "./social.schema.js";
import {
    createPostHandler,
    getFeedHandler,
    getPostByIdHandler,
    deletePostHandler,
    createCommentHandler,
    deleteCommentHandler,
    toggleLikeHandler,
    toggleFollowHandler,
    getFollowersHandler,
    getFollowingHandler,
} from "./social.controller.js";

export async function socialRoutes(server: FastifyInstance) {
    // All social routes require authentication
    server.addHook("onRequest", server.authenticate);

    // ── Posts ──

    server.post("/post", {
        schema: {
            body: createPostSchema,
            response: { 201: postResponseSchema },
            tags: ["Social"],
            summary: "Create a new post",
            description: "Create a new post with optional media attachments",
            security: [{ bearerAuth: [] }],
        },
        handler: createPostHandler,
    });

    server.get("/feed", {
        schema: {
            querystring: postListQuerySchema,
            response: { 200: postListResponseSchema },
            tags: ["Social"],
            summary: "Get feed",
            description: "Get a paginated feed of all posts, newest first",
            security: [{ bearerAuth: [] }],
        },
        handler: getFeedHandler,
    });

    server.get("/post/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: postResponseSchema },
            tags: ["Social"],
            summary: "Get post details",
            description: "Get a single post with all comments, likes, and media",
            security: [{ bearerAuth: [] }],
        },
        handler: getPostByIdHandler,
    });

    server.delete("/post/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: messageResponseSchema },
            tags: ["Social"],
            summary: "Delete a post",
            description: "Delete your own post (ownership required)",
            security: [{ bearerAuth: [] }],
        },
        handler: deletePostHandler,
    });

    // ── Comments ──

    server.post("/comment", {
        schema: {
            body: createCommentSchema,
            response: { 201: commentResponseSchema },
            tags: ["Social"],
            summary: "Add a comment",
            description: "Add a comment to a post",
            security: [{ bearerAuth: [] }],
        },
        handler: createCommentHandler,
    });

    server.delete("/comment/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: messageResponseSchema },
            tags: ["Social"],
            summary: "Delete a comment",
            description: "Delete your own comment (ownership required)",
            security: [{ bearerAuth: [] }],
        },
        handler: deleteCommentHandler,
    });

    // ── Likes ──

    server.post("/like/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: toggleResponseSchema },
            tags: ["Social"],
            summary: "Toggle like on a post",
            description: "Like a post if not liked, unlike if already liked",
            security: [{ bearerAuth: [] }],
        },
        handler: toggleLikeHandler,
    });

    // ── Follows ──

    server.post("/follow/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: toggleResponseSchema },
            tags: ["Social"],
            summary: "Toggle follow a user",
            description: "Follow a user if not following, unfollow if already following",
            security: [{ bearerAuth: [] }],
        },
        handler: toggleFollowHandler,
    });

    server.get("/followers/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: followListResponseSchema },
            tags: ["Social"],
            summary: "Get followers",
            description: "Get a user's followers list",
            security: [{ bearerAuth: [] }],
        },
        handler: getFollowersHandler,
    });

    server.get("/following/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: followListResponseSchema },
            tags: ["Social"],
            summary: "Get following",
            description: "Get list of users someone is following",
            security: [{ bearerAuth: [] }],
        },
        handler: getFollowingHandler,
    });
}
