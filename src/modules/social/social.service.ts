import type { FastifyInstance } from "fastify";
import type { CreatePostInput, CreateCommentInput, PostListQuery } from "./social.schema.js";
import { socketManager } from "./socket-manager.js";
import { createNotification } from "../notification/notification.service.js";
import { moderateContent } from "../ai/ai.service.js";

// ── Create Post ──

export async function createPost(server: FastifyInstance, userId: string, input: CreatePostInput) {
    const data: any = {
        content: input.content ?? null,
        userId,
    };

    if (input.mediaUrls && input.mediaUrls.length > 0) {
        data.media = {
            create: input.mediaUrls.map((m) => ({
                url: m.url,
                type: m.type,
            })),
        };
    }

    const post = await server.prisma.post.create({
        data,
        select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, username: true, avatar: true } },
            media: { select: { id: true, url: true, type: true } },
            comments: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: { select: { id: true, username: true, avatar: true } },
                },
            },
            _count: { select: { likes: true, comments: true } },
        },
    });

    return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        comments: post.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
        })),
        isLiked: false, // Just created, can't be liked yet by the creator
    };
}

// ── Get Feed (Paginated) ──

export async function getFeed(server: FastifyInstance, userId: string, query: PostListQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        server.prisma.post.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                content: true,
                createdAt: true,
                user: { select: { id: true, username: true, avatar: true } },
                media: { select: { id: true, url: true, type: true } },
                comments: {
                    orderBy: { createdAt: "asc" },
                    take: 3, // Only show latest 3 comments in feed
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        user: { select: { id: true, username: true, avatar: true } },
                    },
                },
                _count: { select: { likes: true, comments: true } },
                likes: {
                    where: { userId },
                    select: { userId: true },
                },
            },
        }),
        server.prisma.post.count(),
    ]);

    return {
        data: data.map((post) => ({
            ...post,
            createdAt: post.createdAt.toISOString(),
            comments: post.comments.map((c) => ({
                ...c,
                createdAt: c.createdAt.toISOString(),
            })),
            isLiked: post.likes.length > 0,
            likes: undefined, // Strip the raw likes array from response
        })),
        total,
        page,
        limit,
    };
}

// ── Get Post By ID ──

export async function getPostById(server: FastifyInstance, userId: string, postId: string) {
    const post = await server.prisma.post.findUnique({
        where: { id: postId },
        select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, username: true, avatar: true } },
            media: { select: { id: true, url: true, type: true } },
            comments: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: { select: { id: true, username: true, avatar: true } },
                },
            },
            _count: { select: { likes: true, comments: true } },
            likes: {
                where: { userId },
                select: { userId: true },
            },
        },
    });

    if (!post) {
        throw new Error("Post not found");
    }

    return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        comments: post.comments.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
        })),
        isLiked: post.likes.length > 0,
        likes: undefined,
    };
}

// ── Delete Post ──

export async function deletePost(server: FastifyInstance, userId: string, postId: string) {
    const post = await server.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
        throw new Error("Post not found");
    }

    if (post.userId !== userId) {
        throw new Error("Forbidden");
    }

    await server.prisma.post.delete({ where: { id: postId } });

    return { message: "Post deleted successfully" };
}

// ── Create Comment ──

export async function createComment(server: FastifyInstance, userId: string, input: CreateCommentInput) {
    // Verify post exists
    const post = await server.prisma.post.findUnique({ where: { id: input.postId } });
    if (!post) {
        throw new Error("Post not found");
    }

    // 🛡️ AI Moderation
    const moderation = await moderateContent(input.content);
    if (moderation.toxic) {
        throw new Error(`Comment rejected: ${moderation.reason}`);
    }

    const comment = await server.prisma.comment.create({
        data: {
            content: input.content,
            userId,
            postId: input.postId,
            isSpoiler: moderation.spoiler,
        },
        select: {
            id: true,
            content: true,
            isSpoiler: true,
            createdAt: true,
            user: { select: { id: true, username: true, avatar: true } },
        },
    });

    const result = {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
    };

    // 🔴 Broadcast to all sockets watching this post
    socketManager.broadcastToRoom(input.postId, "new_comment", result);

    // 🔔 Notify post owner (if not commenting on own post)
    if (post.userId !== userId) {
        const commenter = await server.prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await createNotification(server, post.userId, "COMMENT", `${commenter?.username ?? "Someone"} commented on your post`, input.postId);
    }

    return result;
}

// ── Delete Comment ──

export async function deleteComment(server: FastifyInstance, userId: string, commentId: string) {
    const comment = await server.prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
        throw new Error("Comment not found");
    }

    if (comment.userId !== userId) {
        throw new Error("Forbidden");
    }

    await server.prisma.comment.delete({ where: { id: commentId } });

    return { message: "Comment deleted successfully" };
}

// ── Toggle Like ──

export async function toggleLike(server: FastifyInstance, userId: string, postId: string) {
    // Verify post exists
    const post = await server.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
        throw new Error("Post not found");
    }

    // Check if already liked (composite key: userId + postId)
    const existingLike = await server.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
        await server.prisma.like.delete({
            where: { userId_postId: { userId, postId } },
        });

        // 🔴 Broadcast unlike to all sockets watching this post
        const likeCount = await server.prisma.like.count({ where: { postId } });
        socketManager.broadcastToRoom(postId, "like_updated", { postId, userId, action: "unliked", likeCount });

        return { message: "Post unliked", status: "removed" as const };
    }

    await server.prisma.like.create({
        data: { userId, postId },
    });

    // 🔴 Broadcast like to all sockets watching this post
    const likeCount = await server.prisma.like.count({ where: { postId } });
    socketManager.broadcastToRoom(postId, "like_updated", { postId, userId, action: "liked", likeCount });

    // 🔔 Notify post owner (if not liking own post)
    if (post.userId !== userId) {
        const liker = await server.prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await createNotification(server, post.userId, "LIKE", `${liker?.username ?? "Someone"} liked your post`, postId);
    }

    return { message: "Post liked", status: "added" as const };
}

// ── Toggle Follow ──

export async function toggleFollow(server: FastifyInstance, followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new Error("Cannot follow yourself");
    }

    // Verify target user exists
    const targetUser = await server.prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
        throw new Error("User not found");
    }

    // Check if already following (composite key: followerId + followingId)
    const existingFollow = await server.prisma.follows.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
    });

    if (existingFollow) {
        await server.prisma.follows.delete({
            where: { followerId_followingId: { followerId, followingId } },
        });
        return { message: "Unfollowed user", status: "removed" as const };
    }

    await server.prisma.follows.create({
        data: { followerId, followingId },
    });

    // 🔔 Notify the followed user
    const follower = await server.prisma.user.findUnique({ where: { id: followerId }, select: { username: true } });
    await createNotification(server, followingId, "FOLLOW", `${follower?.username ?? "Someone"} started following you`, followerId);

    return { message: "Followed user", status: "added" as const };
}

// ── Get Followers ──

export async function getFollowers(server: FastifyInstance, userId: string) {
    const followers = await server.prisma.follows.findMany({
        where: { followingId: userId },
        select: {
            follower: {
                select: { id: true, username: true, avatar: true, bio: true },
            },
        },
    });

    return {
        data: followers.map((f) => f.follower),
        total: followers.length,
    };
}

// ── Get Following ──

export async function getFollowing(server: FastifyInstance, userId: string) {
    const following = await server.prisma.follows.findMany({
        where: { followerId: userId },
        select: {
            following: {
                select: { id: true, username: true, avatar: true, bio: true },
            },
        },
    });

    return {
        data: following.map((f) => f.following),
        total: following.length,
    };
}
