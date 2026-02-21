import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// ── Params ──

export const paramsWithIdSchema = Type.Object({
    id: Type.String(),
});

// ── Vibe Search ──

export const vibeSearchBodySchema = Type.Object({
    query: Type.String({ minLength: 3, description: "Natural language description of the mood/vibe" }),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10 })),
});

export type VibeSearchBody = Static<typeof vibeSearchBodySchema>;

export const vibeSearchResultSchema = Type.Object({
    animeId: Type.String(),
    title: Type.String(),
    matchReason: Type.String(),
    score: Type.Number(),
});

export const vibeSearchResponseSchema = Type.Object({
    query: Type.String(),
    results: Type.Array(vibeSearchResultSchema),
});

// ── Recommendations ──

export const recommendationSchema = Type.Object({
    animeId: Type.String(),
    title: Type.String(),
    reason: Type.String(),
    confidence: Type.Number(),
});

export const recommendationsResponseSchema = Type.Object({
    recommendations: Type.Array(recommendationSchema),
});

// ── Consensus Summary ──

export const consensusSummaryResponseSchema = Type.Object({
    summary: Type.String(),
    sentiment: Type.String(),
    totalReviews: Type.Number(),
    avgScore: Type.Number(),
});

// ── Avatar Generator ──

export const generateAvatarBodySchema = Type.Object({
    prompt: Type.String({ minLength: 3, description: "Text description for the avatar, e.g. 'Cyberpunk samurai with neon blue hair'" }),
});

export type GenerateAvatarBody = Static<typeof generateAvatarBodySchema>;

export const avatarResponseSchema = Type.Object({
    imageUrl: Type.String(),
    prompt: Type.String(),
});

// ── Generic ──

export const errorResponseSchema = Type.Object({
    statusCode: Type.Number(),
    error: Type.String(),
    message: Type.String(),
});
