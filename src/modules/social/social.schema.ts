import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// ── Params ──

export const paramsWithIdSchema = Type.Object({
    id: Type.String(),
});

export type ParamsWithId = Static<typeof paramsWithIdSchema>;

// ── Post Schemas ──

export const createPostSchema = Type.Object({
    content: Type.Optional(Type.String()),
    mediaUrls: Type.Optional(
        Type.Array(
            Type.Object({
                url: Type.String(),
                type: Type.Union([Type.Literal("IMAGE"), Type.Literal("VIDEO")]),
            })
        )
    ),
});

export type CreatePostInput = Static<typeof createPostSchema>;

export const postListQuerySchema = Type.Object({
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
});

export type PostListQuery = Static<typeof postListQuerySchema>;

// ── Comment Schemas ──

export const createCommentSchema = Type.Object({
    postId: Type.String(),
    content: Type.String({ minLength: 1 }),
});

export type CreateCommentInput = Static<typeof createCommentSchema>;

// ── Response Schemas ──

const userSummarySchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    avatar: Type.Union([Type.String(), Type.Null()]),
});

const mediaResponseSchema = Type.Object({
    id: Type.String(),
    url: Type.String(),
    type: Type.String(),
});

export const commentResponseSchema = Type.Object({
    id: Type.String(),
    content: Type.String(),
    createdAt: Type.String(),
    user: userSummarySchema,
});

export const postResponseSchema = Type.Object({
    id: Type.String(),
    content: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String(),
    user: userSummarySchema,
    media: Type.Array(mediaResponseSchema),
    comments: Type.Array(commentResponseSchema),
    _count: Type.Object({
        likes: Type.Number(),
        comments: Type.Number(),
    }),
    isLiked: Type.Boolean(),
});

export const postListResponseSchema = Type.Object({
    data: Type.Array(postResponseSchema),
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
});

export const followUserSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    avatar: Type.Union([Type.String(), Type.Null()]),
    bio: Type.Union([Type.String(), Type.Null()]),
});

export const followListResponseSchema = Type.Object({
    data: Type.Array(followUserSchema),
    total: Type.Number(),
});

export const messageResponseSchema = Type.Object({
    message: Type.String(),
});

export const toggleResponseSchema = Type.Object({
    message: Type.String(),
    status: Type.Union([Type.Literal("added"), Type.Literal("removed")]),
});
