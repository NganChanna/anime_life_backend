import type { FastifyReply, FastifyRequest } from "fastify";
import type { ParamsWithId, CreateConversationInput, SendMessageInput, ChatHistoryQuery } from "./chat.schema.js";
import { createConversation, listConversations, getChatHistory, sendMessage } from "./chat.service.js";

// ── POST /conversation ──

export async function createConversationHandler(
    request: FastifyRequest<{ Body: CreateConversationInput }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const conversation = await createConversation(request.server, user.id, request.body);
        return reply.code(201).send(conversation);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /conversations ──

export async function listConversationsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await listConversations(request.server, user.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /conversation/:id/messages ──

export async function getChatHistoryHandler(
    request: FastifyRequest<{ Params: ParamsWithId; Querystring: ChatHistoryQuery }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await getChatHistory(request.server, user.id, request.params.id, request.query);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Conversation not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /conversation/:id/message ──

export async function sendMessageHandler(
    request: FastifyRequest<{ Params: ParamsWithId; Body: SendMessageInput }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const message = await sendMessage(request.server, user.id, request.params.id, request.body);
        return reply.code(201).send(message);
    } catch (error: any) {
        if (error.message === "Conversation not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}
