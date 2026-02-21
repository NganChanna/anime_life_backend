import type { FastifyReply, FastifyRequest } from "fastify";
import type { ParamsWithId, CreatePostInput, CreateCommentInput, PostListQuery } from "./social.schema.js";
import {
    createPost,
    getFeed,
    getPostById,
    deletePost,
    createComment,
    deleteComment,
    toggleLike,
    toggleFollow,
    getFollowers,
    getFollowing,
} from "./social.service.js";

// ── POST /post ──

export async function createPostHandler(
    request: FastifyRequest<{ Body: CreatePostInput }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const post = await createPost(request.server, user.id, request.body);
        return reply.code(201).send(post);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /feed ──

export async function getFeedHandler(
    request: FastifyRequest<{ Querystring: PostListQuery }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await getFeed(request.server, user.id, request.query);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /post/:id ──

export async function getPostByIdHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const post = await getPostById(request.server, user.id, request.params.id);
        return reply.code(200).send(post);
    } catch (error: any) {
        if (error.message === "Post not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── DELETE /post/:id ──

export async function deletePostHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await deletePost(request.server, user.id, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Post not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        if (error.message === "Forbidden") {
            return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "You can only delete your own posts" });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /comment ──

export async function createCommentHandler(
    request: FastifyRequest<{ Body: CreateCommentInput }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const comment = await createComment(request.server, user.id, request.body);
        return reply.code(201).send(comment);
    } catch (error: any) {
        if (error.message === "Post not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── DELETE /comment/:id ──

export async function deleteCommentHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await deleteComment(request.server, user.id, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Comment not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        if (error.message === "Forbidden") {
            return reply.code(403).send({ statusCode: 403, error: "Forbidden", message: "You can only delete your own comments" });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /like/:id (toggle) ──

export async function toggleLikeHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await toggleLike(request.server, user.id, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Post not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── POST /follow/:id (toggle) ──

export async function toggleFollowHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string; role: string };
        const result = await toggleFollow(request.server, user.id, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        if (error.message === "Cannot follow yourself") {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: error.message });
        }
        if (error.message === "User not found") {
            return reply.code(404).send({ statusCode: 404, error: "Not Found", message: error.message });
        }
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /followers/:id ──

export async function getFollowersHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const result = await getFollowers(request.server, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}

// ── GET /following/:id ──

export async function getFollowingHandler(
    request: FastifyRequest<{ Params: ParamsWithId }>,
    reply: FastifyReply
) {
    try {
        const result = await getFollowing(request.server, request.params.id);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Something went wrong" });
    }
}
