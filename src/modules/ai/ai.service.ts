import { GoogleGenAI } from "@google/genai";
import { envConfig } from "../../config/env-config.js";
import type { FastifyInstance } from "fastify";

const genAI = new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

// ─────────────────────────────────────────────
// 1. Content Moderation (Spoiler + Toxicity)
// ─────────────────────────────────────────────

export interface ModerationResult {
    safe: boolean;
    spoiler: boolean;
    toxic: boolean;
    reason: string;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
    const prompt = `You are a content moderator for an anime social platform. Analyze the following user-submitted text and return a JSON object with these fields:
- "safe" (boolean): true if the content is acceptable to post
- "spoiler" (boolean): true if the text reveals major plot points, character deaths, surprise twists, or ending details of any anime or show
- "toxic" (boolean): true if the text contains hate speech, harassment, threats, slurs, or excessive profanity
- "reason" (string): a brief explanation of why the content was flagged, or "OK" if safe

Return ONLY the JSON object, no markdown formatting.

Text to analyze: "${text.replace(/"/g, '\\"')}"`;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const raw = response.text?.trim() ?? "";
        // Strip markdown code fences if present
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
        const result = JSON.parse(jsonStr) as ModerationResult;

        return {
            safe: result.safe ?? true,
            spoiler: result.spoiler ?? false,
            toxic: result.toxic ?? false,
            reason: result.reason ?? "OK",
        };
    } catch {
        // Fail open — don't block content if AI is unavailable
        return { safe: true, spoiler: false, toxic: false, reason: "Moderation unavailable" };
    }
}

// ─────────────────────────────────────────────
// 2. Smart "Vibe" Search
// ─────────────────────────────────────────────

export interface VibeSearchResult {
    animeId: string;
    title: string;
    matchReason: string;
    score: number;
}

export async function vibeSearch(
    server: FastifyInstance,
    query: string,
    limit: number = 10
): Promise<VibeSearchResult[]> {
    // Fetch the anime catalog (title + synopsis + genres)
    const animeList = await server.prisma.anime.findMany({
        select: {
            id: true,
            title: true,
            synopsis: true,
            genres: { select: { name: true } },
            rating: true,
        },
        take: 200, // Cap to avoid massive prompts
        orderBy: { rating: "desc" },
    });

    const catalog = animeList.map((a) => ({
        id: a.id,
        title: a.title,
        synopsis: (a.synopsis ?? "").slice(0, 200),
        genres: a.genres.map((g) => g.name).join(", "),
    }));

    const prompt = `You are an anime recommendation engine. A user is searching by mood/vibe. Match their description to the best anime from this catalog.

User query: "${query}"

Anime catalog (JSON):
${JSON.stringify(catalog)}

Return a JSON array of the top ${limit} matches, each with:
- "animeId": the id from the catalog
- "title": the anime title
- "matchReason": a short sentence explaining why this matches the user's vibe
- "score": a relevance score from 0.0 to 1.0

Return ONLY the JSON array, no markdown formatting. If no good matches exist, return an empty array.`;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const raw = response.text?.trim() ?? "[]";
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
        return JSON.parse(jsonStr) as VibeSearchResult[];
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────
// 3. Personalized Watch Recommendations
// ─────────────────────────────────────────────

export interface Recommendation {
    animeId: string;
    title: string;
    reason: string;
    confidence: number;
}

export async function getRecommendations(
    server: FastifyInstance,
    userId: string
): Promise<Recommendation[]> {
    // Gather user's taste profile
    const [watchlist, reviews] = await Promise.all([
        server.prisma.watchlist.findMany({
            where: { userId },
            select: {
                status: true,
                progress: true,
                anime: {
                    select: {
                        id: true,
                        title: true,
                        synopsis: true,
                        genres: { select: { name: true } },
                        rating: true,
                    },
                },
            },
        }),
        server.prisma.review.findMany({
            where: { userId },
            select: {
                score: true,
                content: true,
                anime: {
                    select: { id: true, title: true, genres: { select: { name: true } } },
                },
            },
        }),
    ]);

    if (watchlist.length === 0 && reviews.length === 0) {
        return [];
    }

    // Build taste profile
    const profile = {
        watched: watchlist.map((w) => ({
            title: w.anime.title,
            status: w.status,
            genres: w.anime.genres.map((g) => g.name),
        })),
        reviews: reviews.map((r) => ({
            title: r.anime.title,
            score: r.score,
            comment: (r.content ?? "").slice(0, 100),
            genres: r.anime.genres.map((g) => g.name),
        })),
    };

    // Get IDs the user has already watched
    const watchedIds = new Set(watchlist.map((w) => w.anime.id));

    // Fetch unwatched anime as candidates
    const candidates = await server.prisma.anime.findMany({
        where: { id: { notIn: [...watchedIds] } },
        select: {
            id: true,
            title: true,
            synopsis: true,
            genres: { select: { name: true } },
            rating: true,
        },
        take: 100,
        orderBy: { rating: "desc" },
    });

    const prompt = `You are a personalized anime recommendation engine. Based on this user's taste profile, recommend the best 5 anime from the candidate list they haven't watched yet.

User taste profile:
${JSON.stringify(profile)}

Candidate anime (JSON):
${JSON.stringify(candidates.map((c) => ({ id: c.id, title: c.title, synopsis: (c.synopsis ?? "").slice(0, 150), genres: c.genres.map((g) => g.name) })))}

Return a JSON array of exactly 5 objects:
- "animeId": candidate id
- "title": anime title
- "reason": a personalized sentence explaining why this fits THEIR taste (reference specific shows they liked, genres they prefer, etc.)
- "confidence": 0.0-1.0 how confident you are in this recommendation

Return ONLY the JSON array, no markdown formatting.`;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const raw = response.text?.trim() ?? "[]";
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
        return JSON.parse(jsonStr) as Recommendation[];
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────
// 4. Community Consensus Summaries
// ─────────────────────────────────────────────

export interface ConsensusSummary {
    summary: string;
    sentiment: "positive" | "mixed" | "negative";
    totalReviews: number;
    avgScore: number;
}

export async function getConsensusSummary(
    server: FastifyInstance,
    animeId: string
): Promise<ConsensusSummary> {
    const anime = await server.prisma.anime.findUnique({
        where: { id: animeId },
        select: { title: true },
    });

    if (!anime) {
        throw new Error("Anime not found");
    }

    const reviews = await server.prisma.review.findMany({
        where: { animeId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
            score: true,
            content: true,
            user: { select: { username: true } },
        },
    });

    if (reviews.length === 0) {
        return {
            summary: "No reviews yet. Be the first to share your thoughts!",
            sentiment: "mixed",
            totalReviews: 0,
            avgScore: 0,
        };
    }

    const totalReviews = reviews.length;
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / totalReviews;

    const reviewTexts = reviews
        .filter((r) => r.content)
        .map((r) => `[${r.score}/10 by ${r.user.username}]: ${r.content!.slice(0, 200)}`)
        .join("\n");

    const prompt = `You are a community summarizer for the anime "${anime.title}". Read these ${totalReviews} reviews and write a single concise paragraph (2-4 sentences) that captures the community's overall consensus. Mention specific points of praise and criticism that multiple reviewers agree on. Write in third person ("The community...", "Most fans agree...").

Also determine the overall sentiment: "positive", "mixed", or "negative".

Reviews:
${reviewTexts}

Return ONLY a JSON object with:
- "summary": the consensus paragraph
- "sentiment": "positive" | "mixed" | "negative"

No markdown formatting.`;

    try {
        const response = await genAI.models.generateContent({
            model: MODEL,
            contents: prompt,
        });

        const raw = response.text?.trim() ?? "";
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
        const result = JSON.parse(jsonStr);

        return {
            summary: result.summary ?? "Unable to generate summary.",
            sentiment: result.sentiment ?? "mixed",
            totalReviews,
            avgScore: Math.round(avgScore * 10) / 10,
        };
    } catch {
        return {
            summary: "Unable to generate summary at this time.",
            sentiment: "mixed",
            totalReviews,
            avgScore: Math.round(avgScore * 10) / 10,
        };
    }
}

// ─────────────────────────────────────────────
// 5. AI Avatar Generator
// ─────────────────────────────────────────────

export interface AvatarResult {
    imageUrl: string;
    prompt: string;
}

export async function generateAvatar(promptText: string): Promise<AvatarResult> {
    // Use Gemini to create an optimized image generation prompt
    const refinedPromptResponse = await genAI.models.generateContent({
        model: MODEL,
        contents: `Create a concise image generation prompt for an anime-style profile avatar based on this description: "${promptText}". The avatar should be a portrait/headshot style, anime art, vibrant colors, detailed, high quality. Return ONLY the refined prompt text, nothing else.`,
    });

    const refinedPrompt = refinedPromptResponse.text?.trim() ?? promptText;

    // Use Gemini's image generation via Imagen
    const imageResponse = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: refinedPrompt,
        config: {
            responseModalities: ["TEXT", "IMAGE"] as any,
        },
    });

    // Extract image data from the response
    const parts = (imageResponse as any).candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart?.inlineData?.data) {
        throw new Error("Avatar generation failed — no image returned");
    }

    // Return base64 image data for the client to handle upload
    return {
        imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
        prompt: refinedPrompt,
    };
}
