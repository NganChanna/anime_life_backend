import type { FastifyReply, FastifyRequest } from "fastify";
import type { UpdateRoleInput, UserIdParams } from "./admin.schema.js";

export async function getStatsHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const [totalUsers, totalAdmins, totalAnime] = await Promise.all([
        request.server.prisma.user.count(),
        request.server.prisma.user.count({ where: { role: "ADMIN" } }),
        request.server.prisma.anime.count(),
    ]);

    return reply.code(200).send({ totalUsers, totalAdmins, totalAnime });
}

export async function getUsersHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const users = await request.server.prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatar: true,
            bio: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return reply.code(200).send(users);
}

export async function updateUserRoleHandler(
    request: FastifyRequest<{ Params: UserIdParams; Body: UpdateRoleInput }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { role } = request.body;

    // Prevent self-demotion
    const currentUser = request.user as { id: string };
    if (currentUser.id === id) {
        return reply.code(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: "You cannot change your own role",
        });
    }

    try {
        const user = await request.server.prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, username: true, email: true, role: true },
        });

        return reply.code(200).send(user);
    } catch {
        return reply.code(404).send({
            statusCode: 404,
            error: "Not Found",
            message: "User not found",
        });
    }
}

export async function deleteUserHandler(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    // Prevent self-deletion
    const currentUser = request.user as { id: string };
    if (currentUser.id === id) {
        return reply.code(400).send({
            statusCode: 400,
            error: "Bad Request",
            message: "You cannot delete your own account",
        });
    }

    try {
        await request.server.prisma.user.delete({ where: { id } });
        return reply.code(200).send({ message: "User deleted successfully" });
    } catch {
        return reply.code(404).send({
            statusCode: 404,
            error: "Not Found",
            message: "User not found",
        });
    }
}
