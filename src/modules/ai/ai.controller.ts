import type { FastifyReply, FastifyRequest } from "fastify";
import type { VibeSearchBody, GenerateAvatarBody } from "./ai.schema.js";
import { vibeSearch, getRecommendations, getConsensusSummary, generateAvatar } from "./ai.service.js";

// ── POST /vibe-search ──

export async function vibeSearchHandler(
    request: FastifyRequest<{ Body: VibeSearchBody }>,
    reply: FastifyReply
) {
    try {
        const results = await vibeSearch(request.server, request.body.query, request.body.limit);
        return reply.code(200).send({ query: request.body.query, results });
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "AI search failed" });
    }
}

// ── GET /recommendations ──

export async function recommendationsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const recommendations = await getRecommendations(request.server, user.id);
        return reply.code(200).send({ recommendations });
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Recommendation engine failed" });
    }
}

// ── GET /consensus/:id ──

export async function consensusSummaryHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    try {
        const result = await getConsensusSummary(request.server, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Anime not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Summary generation failed" });
    }
}

// ── POST /generate-avatar ──

export async function generateAvatarHandler(
    request: FastifyRequest<{ Body: GenerateAvatarBody }>,
    reply: FastifyReply
) {
    try {
        const result = await generateAvatar(request.body.prompt);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: error.message || "Avatar generation failed" });
    }
}
