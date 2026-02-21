import type { FastifyInstance } from "fastify";
import type { NotificationQuery } from "./notification.schema.js";
import type { NotificationType } from "@prisma/client";
import { socketManager } from "../social/socket-manager.js";

// ── List Notifications ──

export async function listNotifications(server: FastifyInstance, userId: string, query: NotificationQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unreadOnly) {
        where.isRead = false;
    }

    const [data, total, unreadCount] = await Promise.all([
        server.prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                type: true,
                message: true,
                referenceId: true,
                isRead: true,
                createdAt: true,
            },
        }),
        server.prisma.notification.count({ where }),
        server.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
        data: data.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
        total,
        unreadCount,
        page,
        limit,
    };
}

// ── Mark as Read ──

export async function markAsRead(server: FastifyInstance, userId: string, notificationId: string) {
    const notification = await server.prisma.notification.findUnique({ where: { id: notificationId } });

    if (!notification || notification.userId !== userId) {
        throw new Error("Notification not found");
    }

    await server.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });

    return { message: "Notification marked as read" };
}

// ── Mark All as Read ──

export async function markAllAsRead(server: FastifyInstance, userId: string) {
    await server.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });

    return { message: "All notifications marked as read" };
}

// ── Delete Notification ──

export async function deleteNotification(server: FastifyInstance, userId: string, notificationId: string) {
    const notification = await server.prisma.notification.findUnique({ where: { id: notificationId } });

    if (!notification || notification.userId !== userId) {
        throw new Error("Notification not found");
    }

    await server.prisma.notification.delete({ where: { id: notificationId } });

    return { message: "Notification deleted" };
}

// ── Create & Push Notification (Reusable Helper) ──

export async function createNotification(
    server: FastifyInstance,
    userId: string,
    type: NotificationType,
    message: string,
    referenceId?: string
) {
    const notification = await server.prisma.notification.create({
        data: {
            userId,
            type,
            message,
            referenceId: referenceId ?? null,
        },
        select: {
            id: true,
            type: true,
            message: true,
            referenceId: true,
            isRead: true,
            createdAt: true,
        },
    });

    const result = { ...notification, createdAt: notification.createdAt.toISOString() };

    // 🔴 Push to user's notification channel in real-time
    socketManager.sendToUser(userId, "new_notification", result);

    return result;
}
