import type { FastifyInstance } from "fastify";

// ── Get User Profile ──

export async function getUserProfile(server: FastifyInstance, userId: string) {
    const user = await server.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatar: true,
            bio: true,
            createdAt: true,
            _count: {
                select: {
                    followers: true,
                    following: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
        followerCount: user._count.followers,
        followingCount: user._count.following,
    };
}

// ── Get Followers ──

export async function getFollowers(server: FastifyInstance, userId: string) {
    const follows = await server.prisma.follows.findMany({
        where: { followingId: userId },
        select: {
            follower: {
                select: { id: true, username: true, avatar: true },
            },
        },
    });

    return follows.map((f) => f.follower);
}

// ── Get Following ──

export async function getFollowing(server: FastifyInstance, userId: string) {
    const follows = await server.prisma.follows.findMany({
        where: { followerId: userId },
        select: {
            following: {
                select: { id: true, username: true, avatar: true },
            },
        },
    });

    return follows.map((f) => f.following);
}

// ── Follow User ──

export async function followUser(server: FastifyInstance, followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new Error("You cannot follow yourself");
    }

    // Check target user exists
    const targetUser = await server.prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
        throw new Error("User not found");
    }

    // Check if already following
    const existing = await server.prisma.follows.findUnique({
        where: {
            followerId_followingId: { followerId, followingId },
        },
    });

    if (existing) {
        throw new Error("Already following this user");
    }

    await server.prisma.follows.create({
        data: { followerId, followingId },
    });

    return { message: "Followed successfully" };
}

// ── Unfollow User ──

export async function unfollowUser(server: FastifyInstance, followerId: string, followingId: string) {
    if (followerId === followingId) {
        throw new Error("You cannot unfollow yourself");
    }

    const existing = await server.prisma.follows.findUnique({
        where: {
            followerId_followingId: { followerId, followingId },
        },
    });

    if (!existing) {
        throw new Error("You are not following this user");
    }

    await server.prisma.follows.delete({
        where: {
            followerId_followingId: { followerId, followingId },
        },
    });

    return { message: "Unfollowed successfully" };
}

// ── Get User Watchlist ──

export async function getUserWatchlist(server: FastifyInstance, userId: string) {
    const watchlist = await server.prisma.watchlist.findMany({
        where: { userId },
        select: {
            animeId: true,
            status: true,
            progress: true,
            anime: {
                select: {
                    title: true,
                    coverImage: true,
                },
            },
        },
    });

    return watchlist.map((w) => ({
        animeId: w.animeId,
        title: w.anime.title,
        coverImage: w.anime.coverImage,
        status: w.status,
        progress: w.progress,
    }));
}
