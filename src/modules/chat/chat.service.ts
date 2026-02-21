import type { FastifyInstance } from "fastify";
import type { CreateConversationInput, SendMessageInput, ChatHistoryQuery } from "./chat.schema.js";
import { socketManager } from "../social/socket-manager.js";
import { moderateContent } from "../ai/ai.service.js";

// ── Create Conversation ──

export async function createConversation(server: FastifyInstance, userId: string, input: CreateConversationInput) {
    // Include the creator in the member list
    const allMemberIds = [...new Set([userId, ...input.memberIds])];

    // For DMs (2 people), check if a conversation already exists
    if (!input.isGroup && allMemberIds.length === 2) {
        const existing = await server.prisma.conversation.findFirst({
            where: {
                isGroup: false,
                AND: allMemberIds.map((id) => ({
                    members: { some: { userId: id } },
                })),
            },
            select: {
                id: true,
                name: true,
                isGroup: true,
                createdAt: true,
                members: {
                    select: {
                        userId: true,
                        user: { select: { id: true, username: true, avatar: true } },
                    },
                },
            },
        });

        if (existing) {
            return { ...existing, createdAt: existing.createdAt.toISOString(), lastMessage: null };
        }
    }

    const conversation = await server.prisma.conversation.create({
        data: {
            name: input.name ?? null,
            isGroup: input.isGroup ?? false,
            members: {
                create: allMemberIds.map((id) => ({ userId: id })),
            },
        },
        select: {
            id: true,
            name: true,
            isGroup: true,
            createdAt: true,
            members: {
                select: {
                    userId: true,
                    user: { select: { id: true, username: true, avatar: true } },
                },
            },
        },
    });

    return { ...conversation, createdAt: conversation.createdAt.toISOString(), lastMessage: null };
}

// ── List Conversations ──

export async function listConversations(server: FastifyInstance, userId: string) {
    const conversations = await server.prisma.conversation.findMany({
        where: {
            members: { some: { userId } },
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            isGroup: true,
            createdAt: true,
            members: {
                select: {
                    userId: true,
                    user: { select: { id: true, username: true, avatar: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    conversationId: true,
                    content: true,
                    createdAt: true,
                    sender: { select: { id: true, username: true, avatar: true } },
                },
            },
        },
    });

    return {
        data: conversations.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            lastMessage: c.messages[0]
                ? { ...c.messages[0], createdAt: c.messages[0].createdAt.toISOString() }
                : null,
            messages: undefined,
        })),
    };
}

// ── Get Chat History ──

export async function getChatHistory(server: FastifyInstance, userId: string, conversationId: string, query: ChatHistoryQuery) {
    // Verify membership
    const membership = await server.prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
        throw new Error("Conversation not found");
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        server.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
                id: true,
                conversationId: true,
                content: true,
                createdAt: true,
                sender: { select: { id: true, username: true, avatar: true } },
            },
        }),
        server.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
        data: data.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
        total,
        page,
        limit,
    };
}

// ── Send Message ──

export async function sendMessage(server: FastifyInstance, userId: string, conversationId: string, input: SendMessageInput) {
    // Verify membership
    const membership = await server.prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
        throw new Error("Conversation not found");
    }

    // 🛡️ AI Moderation
    const moderation = await moderateContent(input.content);
    if (moderation.toxic) {
        throw new Error(`Message rejected: ${moderation.reason}`);
    }

    const message = await server.prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            content: input.content,
            isSpoiler: moderation.spoiler,
        },
        select: {
            id: true,
            conversationId: true,
            content: true,
            isSpoiler: true,
            createdAt: true,
            sender: { select: { id: true, username: true, avatar: true } },
        },
    });

    const result = { ...message, createdAt: message.createdAt.toISOString() };

    // 🔴 Broadcast to all sockets in the chat room
    socketManager.broadcastToChat(conversationId, "new_message", result);

    // 🔴 Send notification to all other members
    const members = await server.prisma.conversationMember.findMany({
        where: { conversationId, userId: { not: userId } },
        select: { userId: true },
    });

    for (const member of members) {
        socketManager.sendToUser(member.userId, "new_message_notification", {
            conversationId,
            message: result,
        });
    }

    return result;
}
