import type { FastifyInstance } from "fastify";
import {
    paramsWithIdSchema,
    vibeSearchBodySchema,
    vibeSearchResponseSchema,
    recommendationsResponseSchema,
    consensusSummaryResponseSchema,
    generateAvatarBodySchema,
    avatarResponseSchema,
} from "./ai.schema.js";
import {
    vibeSearchHandler,
    recommendationsHandler,
    consensusSummaryHandler,
    generateAvatarHandler,
} from "./ai.controller.js";

export async function aiRoutes(server: FastifyInstance) {
    // ── Public routes ──

    server.post("/vibe-search", {
        schema: {
            body: vibeSearchBodySchema,
            response: { 200: vibeSearchResponseSchema },
            tags: ["AI"],
            summary: "Smart vibe search",
            description: "Search anime by describing the mood or vibe you're looking for. AI matches your description to the best anime.",
        },
        handler: vibeSearchHandler,
    });

    server.get("/consensus/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: consensusSummaryResponseSchema },
            tags: ["AI"],
            summary: "Community consensus summary",
            description: "AI-generated summary of what the community thinks about an anime, based on recent reviews.",
        },
        handler: consensusSummaryHandler,
    });

    // ── Protected routes ──

    server.register(async function protectedRoutes(protectedServer) {
        protectedServer.addHook("onRequest", server.authenticate);

        protectedServer.get("/recommendations", {
            schema: {
                response: { 200: recommendationsResponseSchema },
                tags: ["AI"],
                summary: "Personalized recommendations",
                description: "Get AI-powered anime recommendations based on your watchlist, ratings, and reviews.",
                security: [{ bearerAuth: [] }],
            },
            handler: recommendationsHandler,
        });

        protectedServer.post("/generate-avatar", {
            schema: {
                body: generateAvatarBodySchema,
                response: { 200: avatarResponseSchema },
                tags: ["AI"],
                summary: "Generate AI avatar",
                description: "Generate a unique anime-style profile avatar from a text description.",
                security: [{ bearerAuth: [] }],
            },
            handler: generateAvatarHandler,
        });
    });
}
