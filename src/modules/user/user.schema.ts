import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// ── Params ──

export const paramsWithIdSchema = Type.Object({
    id: Type.String(),
});

export type ParamsWithId = Static<typeof paramsWithIdSchema>;

// ── User Profile Response ──

export const userProfileResponseSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    role: Type.String(),
    avatar: Type.Union([Type.String(), Type.Null()]),
    bio: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String(),
    followerCount: Type.Number(),
    followingCount: Type.Number(),
});

// ── User List Item (compact card for follower/following lists) ──

export const userListItemSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    avatar: Type.Union([Type.String(), Type.Null()]),
});

export const followListResponseSchema = Type.Array(userListItemSchema);

// ── Watchlist ──

export const watchlistItemSchema = Type.Object({
    animeId: Type.String(),
    title: Type.String(),
    coverImage: Type.Union([Type.String(), Type.Null()]),
    status: Type.String(),
    progress: Type.Number(),
});

export const watchlistResponseSchema = Type.Array(watchlistItemSchema);

// ── Generic Message ──

export const messageResponseSchema = Type.Object({
    message: Type.String(),
});
