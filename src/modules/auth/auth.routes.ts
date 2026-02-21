import type { FastifyInstance } from "fastify";
import {
    createUserSchema, userResponseSchema,
    loginUserSchema, loginResponseSchema,
    updateProfileSchema, changePasswordSchema, messageResponseSchema,
} from "./auth.schema.js";
import {
    registerHandler, loginHandler,
    getMeHandler, updateProfileHandler, changePasswordHandler, logoutHandler,
    githubCallbackHandler, googleCallbackHandler,
} from "./auth.controller.js";

export async function authRoutes(server: FastifyInstance) {
    // ── Public routes ──
    server.post("/register", {
        schema: {
            body: createUserSchema,
            response: { 201: userResponseSchema },
            tags: ["Auth"],
            summary: "Register a new user",
            description: "Register a new user with username, email, and password",
        },
        handler: registerHandler,
    });

    server.post("/login", {
        schema: {
            body: loginUserSchema,
            response: { 200: loginResponseSchema },
            tags: ["Auth"],
            summary: "Login a user",
            description: "Login a user with email and password",
        },
        handler: loginHandler,
    });

    // ── OAuth callback routes ──
    server.get("/github/callback", {
        schema: {
            tags: ["Auth"],
            summary: "GitHub OAuth callback",
            description: "Callback endpoint for GitHub OAuth flow",
            hide: true,
        },
        handler: githubCallbackHandler,
    });

    server.get("/google/callback", {
        schema: {
            tags: ["Auth"],
            summary: "Google OAuth callback",
            description: "Callback endpoint for Google OAuth flow",
            hide: true,
        },
        handler: googleCallbackHandler,
    });

    // ── Protected routes (JWT required) ──
    server.register(async function protectedRoutes(protectedServer) {
        protectedServer.addHook("onRequest", server.authenticate);

        protectedServer.get("/me", {
            schema: {
                response: { 200: userResponseSchema },
                tags: ["Auth"],
                summary: "Get current user",
                description: "Get the currently authenticated user's info",
                security: [{ bearerAuth: [] }],
            },
            handler: getMeHandler,
        });

        protectedServer.put("/profile", {
            schema: {
                body: updateProfileSchema,
                response: { 200: userResponseSchema },
                tags: ["Auth"],
                summary: "Update profile",
                description: "Update the authenticated user's profile",
                security: [{ bearerAuth: [] }],
            },
            handler: updateProfileHandler,
        });

        protectedServer.put("/change-password", {
            schema: {
                body: changePasswordSchema,
                response: { 200: messageResponseSchema },
                tags: ["Auth"],
                summary: "Change password",
                description: "Change the authenticated user's password",
                security: [{ bearerAuth: [] }],
            },
            handler: changePasswordHandler,
        });

        protectedServer.post("/logout", {
            schema: {
                response: { 200: messageResponseSchema },
                tags: ["Auth"],
                summary: "Logout",
                description: "Clear auth cookie and logout",
                security: [{ bearerAuth: [] }],
            },
            handler: logoutHandler,
        });
    });
}
