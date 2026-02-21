import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// ── Params ──

export const paramsWithIdSchema = Type.Object({
    id: Type.String(),
});

export type ParamsWithId = Static<typeof paramsWithIdSchema>;

// ── Query ──

export const notificationQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
    unreadOnly: Type.Optional(Type.Boolean()),
});

export type NotificationQuery = Static<typeof notificationQuerySchema>;

// ── Response Schemas ──

export const notificationResponseSchema = Type.Object({
    id: Type.String(),
    type: Type.String(),
    message: Type.String(),
    referenceId: Type.Union([Type.String(), Type.Null()]),
    isRead: Type.Boolean(),
    createdAt: Type.String(),
});

export const notificationListResponseSchema = Type.Object({
    data: Type.Array(notificationResponseSchema),
    total: Type.Number(),
    unreadCount: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
});

export const genericMessageSchema = Type.Object({
    message: Type.String(),
});
