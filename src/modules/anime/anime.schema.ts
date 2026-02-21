import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// ── Params ──

export const paramsWithIdSchema = Type.Object({
    id: Type.String(),
});

export type ParamsWithId = Static<typeof paramsWithIdSchema>;

// ── Query Filters for listing ──

export const animeListQuerySchema = Type.Object({
    genre: Type.Optional(Type.String()),
    status: Type.Optional(Type.Union([Type.Literal("AIRING"), Type.Literal("FINISHED")])),
    type: Type.Optional(Type.Union([Type.Literal("TV"), Type.Literal("MOVIE"), Type.Literal("OVA")])),
    search: Type.Optional(Type.String()),
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
});

export type AnimeListQuery = Static<typeof animeListQuerySchema>;

// ── Create Anime ──

export const createAnimeSchema = Type.Object({
    title: Type.String({ minLength: 1 }),
    synopsis: Type.Optional(Type.String()),
    type: Type.Union([Type.Literal("TV"), Type.Literal("MOVIE"), Type.Literal("OVA")]),
    status: Type.Union([Type.Literal("AIRING"), Type.Literal("FINISHED")]),
    coverImage: Type.Optional(Type.String()),
    genres: Type.Optional(Type.Array(Type.String())),
});

export type CreateAnimeInput = Static<typeof createAnimeSchema>;

// ── Update Anime ──

export const updateAnimeSchema = Type.Object({
    title: Type.Optional(Type.String({ minLength: 1 })),
    synopsis: Type.Optional(Type.String()),
    type: Type.Optional(Type.Union([Type.Literal("TV"), Type.Literal("MOVIE"), Type.Literal("OVA")])),
    status: Type.Optional(Type.Union([Type.Literal("AIRING"), Type.Literal("FINISHED")])),
    coverImage: Type.Optional(Type.String()),
    genres: Type.Optional(Type.Array(Type.String())),
});

export type UpdateAnimeInput = Static<typeof updateAnimeSchema>;

// ── Create Episode ──

export const createEpisodeSchema = Type.Object({
    episodeNum: Type.Number({ minimum: 1 }),
    title: Type.Optional(Type.String()),
    airDate: Type.Optional(Type.String({ format: "date-time" })),
    videoUrl: Type.Optional(Type.String()),
});

export type CreateEpisodeInput = Static<typeof createEpisodeSchema>;

// ── Response Schemas ──

export const episodeResponseSchema = Type.Object({
    id: Type.String(),
    animeId: Type.String(),
    episodeNum: Type.Number(),
    title: Type.Union([Type.String(), Type.Null()]),
    airDate: Type.Union([Type.String(), Type.Null()]),
});

export const genreResponseSchema = Type.Object({
    id: Type.String(),
    name: Type.String(),
});

export const animeResponseSchema = Type.Object({
    id: Type.String(),
    title: Type.String(),
    synopsis: Type.Union([Type.String(), Type.Null()]),
    type: Type.String(),
    status: Type.String(),
    coverImage: Type.Union([Type.String(), Type.Null()]),
    rating: Type.Number(),
    episodes: Type.Array(episodeResponseSchema),
    genres: Type.Array(genreResponseSchema),
});

export const animeListItemSchema = Type.Object({
    id: Type.String(),
    title: Type.String(),
    type: Type.String(),
    status: Type.String(),
    coverImage: Type.Union([Type.String(), Type.Null()]),
    rating: Type.Number(),
});

export const animeListResponseSchema = Type.Object({
    data: Type.Array(animeListItemSchema),
    total: Type.Number(),
    page: Type.Number(),
    limit: Type.Number(),
});

export const messageResponseSchema = Type.Object({
    message: Type.String(),
});
