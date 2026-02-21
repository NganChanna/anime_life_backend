import type { FastifyReply, FastifyRequest } from "fastify";
import type { ParamsWithId, CreateAnimeInput, UpdateAnimeInput, CreateEpisodeInput, AnimeListQuery } from "./anime.schema.js";
import {
    listAnime,
    getAnimeById,
    createAnime,
    updateAnime,
    deleteAnime,
    addEpisode,
} from "./anime.service.js";

// ── GET /anime ──

export async function listAnimeHandler(
    request: FastifyRequest<{ Querystring: AnimeListQuery }>,
    reply: FastifyReply
) {
    try {
        const result = await listAnime(request.server, request.query);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /anime/:id ──

export async function getAnimeByIdHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const anime = await getAnimeById(request.server, request.params.id);
        return reply.code(200).send(anime);
    } catch (error: any) {
        if (error.message === "Anime not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /anime (Admin) ──

export async function createAnimeHandler(
    request: FastifyRequest<{ Body: CreateAnimeInput }>,
    reply: FastifyReply
) {
    try {
        // Admin check
        const user = request.user as { id: string; role: string };
        if (user.role !== "ADMIN") {
            return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Admin access required" });
        }

        const anime = await createAnime(request.server, request.body);
        return reply.code(201).send(anime);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── PUT /anime/:id (Admin) ──

export async function updateAnimeHandler(
    request: FastifyRequest<{ Params: ParamsWithId; Body: UpdateAnimeInput }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        if (user.role !== "ADMIN") {
            return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Admin access required" });
        }

        const anime = await updateAnime(request.server, request.params.id, request.body);
        return reply.code(200).send(anime);
    } catch (error: any) {
        if (error.message === "Anime not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── DELETE /anime/:id (Admin) ──

export async function deleteAnimeHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        if (user.role !== "ADMIN") {
            return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Admin access required" });
        }

        const result = await deleteAnime(request.server, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Anime not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /anime/:id/episodes (Admin) ──

export async function addEpisodeHandler(
    request: FastifyRequest<{ Params: ParamsWithId; Body: CreateEpisodeInput }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        if (user.role !== "ADMIN") {
            return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "Admin access required" });
        }

        const episode = await addEpisode(request.server, request.params.id, request.body);
        return reply.code(201).send(episode);
    } catch (error: any) {
        if (error.message === "Anime not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}
