import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// ── Params ──

export const paramsWithIdSchema = Type.Object({
    id: Type.String(),
});

export type ParamsWithId = Static<typeof paramsWithIdSchema>;

// ── Create Conversation ──

export const createConversationSchema = Type.Object({
    memberIds: Type.Array(Type.String(), { minItems: 1 }),
    name: Type.Optional(Type.String()),
    isGroup: Type.Optional(Type.Boolean()),
});

export type CreateConversationInput = Static<typeof createConversationSchema>;

// ── Send Message ──

export const sendMessageSchema = Type.Object({
    content: Type.String({ minLength: 1 }),
});

export type SendMessageInput = Static<typeof sendMessageSchema>;

// ── Query ──

export const chatHistoryQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
});

export type ChatHistoryQuery = Static<typeof chatHistoryQuerySchema>;

// ── Response Schemas ──

const userSummarySchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    avatar: Type.Union([Type.String(), Type.Null()]),
});

export const messageResponseSchema = Type.Object({
    id: Type.String(),
    conversationId: Type.String(),
    content: Type.String(),
    createdAt: Type.String(),
    sender: userSummarySchema,
});

export const conversationResponseSchema = Type.Object({
    id: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    isGroup: Type.Boolean(),
    createdAt: Type.String(),
    members: Type.Array(Type.Object({
        userId: Type.String(),
        user: userSummarySchema,
    })),
    lastMessage: Type.Optional(Type.Union([messageResponseSchema, Type.Null()])),
});

export const conversationListResponseSchema = Type.Object({
    data: Type.Array(conversationResponseSchema),
});

export const messageListResponseSchema = Type.Object({
    data: Type.Array(messageResponseSchema),
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
});

export const genericMessageSchema = Type.Object({
    message: Type.String(),
});
