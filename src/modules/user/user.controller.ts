import type { FastifyReply, FastifyRequest } from "fastify";
import type { ParamsWithId } from "./user.schema.js";
import {
    getUserProfile,
    getFollowers,
    getFollowing,
    followUser,
    unfollowUser,
    getUserWatchlist,
} from "./user.service.js";

// ── GET /users/:id ──

export async function getUserProfileHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const profile = await getUserProfile(request.server, request.params.id);
        return reply.code(200).send(profile);
    } catch (error: any) {
        if (error.message === "User not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /users/:id/followers ──

export async function getFollowersHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const followers = await getFollowers(request.server, request.params.id);
        return reply.code(200).send(followers);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /users/:id/following ──

export async function getFollowingHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const following = await getFollowing(request.server, request.params.id);
        return reply.code(200).send(following);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /users/:id/follow (Protected) ──

export async function followUserHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const { id: followerId } = request.user as { id: string };
        const result = await followUser(request.server, followerId, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "You cannot follow yourself") {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: error.message });
        }
        if (error.message === "User not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        if (error.message === "Already following this user") {
            return reply.code(409).send({ statusCode: 409, error: "Conflict", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── DELETE /users/:id/follow (Protected) ──

export async function unfollowUserHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const { id: followerId } = request.user as { id: string };
        const result = await unfollowUser(request.server, followerId, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "You cannot unfollow yourself") {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: error.message });
        }
        if (error.message === "You are not following this user") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /users/:id/watchlist ──

export async function getUserWatchlistHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const watchlist = await getUserWatchlist(request.server, request.params.id);
        return reply.code(200).send(watchlist);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}
