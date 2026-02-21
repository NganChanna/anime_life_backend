import type { FastifyReply, FastifyRequest } from "fastify";
import type { ParamsWithId, NotificationQuery } from "./notification.schema.js";
import { listNotifications, markAsRead, markAllAsRead, deleteNotification } from "./notification.service.js";

// ── GET / ──

export async function listNotificationsHandler(
    request: FastifyRequest<{ Querystring: NotificationQuery }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await listNotifications(request.server, user.id, request.query);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── PATCH /:id/read ──

export async function markAsReadHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await markAsRead(request.server, user.id, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Notification not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── PATCH /read-all ──

export async function markAllAsReadHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await markAllAsRead(request.server, user.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── DELETE /:id ──

export async function deleteNotificationHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await deleteNotification(request.server, user.id, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Notification not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}
