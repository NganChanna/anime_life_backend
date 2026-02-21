import type { FastifyInstance } from "fastify";
import {
    paramsWithIdSchema,
    animeListQuerySchema,
    createAnimeSchema,
    updateAnimeSchema,
    createEpisodeSchema,
    animeResponseSchema,
    animeListResponseSchema,
    episodeResponseSchema,
    messageResponseSchema,
} from "./anime.schema.js";
import {
    listAnimeHandler,
    getAnimeByIdHandler,
    createAnimeHandler,
    updateAnimeHandler,
    deleteAnimeHandler,
    addEpisodeHandler,
} from "./anime.controller.js";

export async function animeRoutes(server: FastifyInstance) {
    // ── Public routes ──

    server.get("/", {
        schema: {
            querystring: animeListQuerySchema,
            response: { 200: animeListResponseSchema },
            tags: ["Anime"],
            summary: "List all anime",
            description: "Browse anime with optional genre, status, type, and search filters. Supports pagination.",
        },
        handler: listAnimeHandler,
    });

    server.get("/:id", {
        schema: {
            params: paramsWithIdSchema,
            response: { 200: animeResponseSchema },
            tags: ["Anime"],
            summary: "Get anime details",
            description: "Get full anime details including episodes and genres",
        },
        handler: getAnimeByIdHandler,
    });

    // ── Protected routes (JWT + Admin) ──

    server.register(async function protectedRoutes(protectedServer) {
        protectedServer.addHook("onRequest", server.authenticate);

        protectedServer.post("/", {
            schema: {
                body: createAnimeSchema,
                response: { 201: animeResponseSchema },
                tags: ["Anime"],
                summary: "Create a new anime",
                description: "Add a new anime to the database (Admin only)",
                security: [{ bearerAuth: [] }],
            },
            handler: createAnimeHandler,
        });

        protectedServer.put("/:id", {
            schema: {
                params: paramsWithIdSchema,
                body: updateAnimeSchema,
                response: { 200: animeResponseSchema },
                tags: ["Anime"],
                summary: "Update anime",
                description: "Update anime details (Admin only)",
                security: [{ bearerAuth: [] }],
            },
            handler: updateAnimeHandler,
        });

        protectedServer.delete("/:id", {
            schema: {
                params: paramsWithIdSchema,
                response: { 200: messageResponseSchema },
                tags: ["Anime"],
                summary: "Delete anime",
                description: "Delete an anime and all its episodes (Admin only)",
                security: [{ bearerAuth: [] }],
            },
            handler: deleteAnimeHandler,
        });

        protectedServer.post("/:id/episodes", {
            schema: {
                params: paramsWithIdSchema,
                body: createEpisodeSchema,
                response: { 201: episodeResponseSchema },
                tags: ["Anime"],
                summary: "Add an episode",
                description: "Add a new episode to an anime (Admin only)",
                security: [{ bearerAuth: [] }],
            },
            handler: addEpisodeHandler,
        });
    });
}
