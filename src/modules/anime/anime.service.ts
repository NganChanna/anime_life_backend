import type { FastifyInstance } from "fastify";
import type { CreateAnimeInput, UpdateAnimeInput, CreateEpisodeInput, AnimeListQuery } from "./anime.schema.js";

// ── List Anime ──

export async function listAnime(server: FastifyInstance, query: AnimeListQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.type) {
        where.type = query.type;
    }
    if (query.search) {
        where.title = { contains: query.search, mode: "insensitive" };
    }
    if (query.genre) {
        where.genres = { some: { name: { equals: query.genre, mode: "insensitive" } } };
    }

    const [data, total] = await Promise.all([
        server.prisma.anime.findMany({
            where,
            skip,
            take: limit,
            orderBy: { title: "asc" },
            select: {
                id: true,
                title: true,
                type: true,
                status: true,
                coverImage: true,
                rating: true,
            },
        }),
        server.prisma.anime.count({ where }),
    ]);

    return { data, total, page, limit };
}

// ── Get Anime By ID ──

export async function getAnimeById(server: FastifyInstance, id: string) {
    const anime = await server.prisma.anime.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            synopsis: true,
            type: true,
            status: true,
            coverImage: true,
            rating: true,
            episodes: {
                orderBy: { episodeNum: "asc" },
                select: {
                    id: true,
                    animeId: true,
                    episodeNum: true,
                    title: true,
                    airDate: true,
                },
            },
            genres: {
                select: { id: true, name: true },
            },
        },
    });

    if (!anime) {
        throw new Error("Anime not found");
    }

    return {
        ...anime,
        episodes: anime.episodes.map((ep) => ({
            ...ep,
            airDate: ep.airDate?.toISOString() ?? null,
        })),
    };
}

// ── Create Anime ──

export async function createAnime(server: FastifyInstance, input: CreateAnimeInput) {
    const data: any = {
        title: input.title,
        synopsis: input.synopsis ?? null,
        type: input.type,
        status: input.status,
        coverImage: input.coverImage ?? null,
    };

    if (input.genres && input.genres.length > 0) {
        data.genres = {
            connectOrCreate: input.genres.map((name) => ({
                where: { name },
                create: { name },
            })),
        };
    }

    const anime = await server.prisma.anime.create({
        data,
        select: {
            id: true,
            title: true,
            synopsis: true,
            type: true,
            status: true,
            coverImage: true,
            rating: true,
            episodes: {
                select: { id: true, animeId: true, episodeNum: true, title: true, airDate: true },
            },
            genres: {
                select: { id: true, name: true },
            },
        },
    });

    return {
        ...anime,
        episodes: (anime as any).episodes.map((ep: any) => ({
            ...ep,
            airDate: ep.airDate?.toISOString() ?? null,
        })),
    };
}

// ── Update Anime ──

export async function updateAnime(server: FastifyInstance, id: string, input: UpdateAnimeInput) {
    // Verify anime exists
    const existing = await server.prisma.anime.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Anime not found");
    }

    const anime = await server.prisma.anime.update({
        where: { id },
        data: {
            ...(input.title && { title: input.title }),
            ...(input.synopsis !== undefined && { synopsis: input.synopsis ?? null }),
            ...(input.type && { type: input.type }),
            ...(input.status && { status: input.status }),
            ...(input.coverImage !== undefined && { coverImage: input.coverImage ?? null }),
            ...(input.genres && {
                genres: {
                    set: [], // Disconnect existing genres
                    connectOrCreate: input.genres.map((name) => ({
                        where: { name },
                        create: { name },
                    })),
                },
            }),
        },
        select: {
            id: true,
            title: true,
            synopsis: true,
            type: true,
            status: true,
            coverImage: true,
            rating: true,
            episodes: {
                orderBy: { episodeNum: "asc" },
                select: { id: true, animeId: true, episodeNum: true, title: true, airDate: true },
            },
            genres: {
                select: { id: true, name: true },
            },
        },
    });

    return {
        ...anime,
        episodes: anime.episodes.map((ep: { id: string; animeId: string; episodeNum: number; title: string | null; airDate: Date | null }) => ({
            ...ep,
            airDate: ep.airDate?.toISOString() ?? null,
        })),
    };
}

// ── Delete Anime ──

export async function deleteAnime(server: FastifyInstance, id: string) {
    const existing = await server.prisma.anime.findUnique({ where: { id } });
    if (!existing) {
        throw new Error("Anime not found");
    }

    await server.prisma.anime.delete({ where: { id } });

    return { message: "Anime deleted successfully" };
}

// ── Add Episode ──

export async function addEpisode(server: FastifyInstance, animeId: string, input: CreateEpisodeInput) {
    // Verify anime exists
    const anime = await server.prisma.anime.findUnique({ where: { id: animeId } });
    if (!anime) {
        throw new Error("Anime not found");
    }

    const episode = await server.prisma.episode.create({
        data: {
            animeId,
            episodeNum: input.episodeNum,
            title: input.title ?? null,
            airDate: input.airDate ? new Date(input.airDate) : null,
        },
        select: {
            id: true,
            animeId: true,
            episodeNum: true,
            title: true,
            airDate: true,
        },
    });

    return {
        ...episode,
        airDate: episode.airDate?.toISOString() ?? null,
    };
}
