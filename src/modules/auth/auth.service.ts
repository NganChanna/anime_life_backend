import type { FastifyInstance } from "fastify";
import type { CreateUserInput, LoginUserInput, UpdateProfileInput, ChangePasswordInput } from "./auth.schema.js";
import bcrypt from "bcrypt";

export async function createUser(server: FastifyInstance, input: CreateUserInput) {
    const { username, email, password } = input;
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if user imports exist
    const existingUser = await server.prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });

    if (existingUser) {
        throw new Error("User already exists with that email or username");
    }

    const user = await server.prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
        },
    });
    return user;
}

export async function loginUser(server: FastifyInstance, input: LoginUserInput) {
    const { email, password } = input;
    const user = await server.prisma.user.findUnique({
        where: {
            email,
        },
        select: { id: true, email: true, username: true, role: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    const accessToken = generateToken(server, user);

    return { accessToken, message: "Login successful" };
}

export function generateToken(server: FastifyInstance, user: { id: string; email: string; username: string; role: string }) {
    return server.jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
    });
}

export async function updateProfile(server: FastifyInstance, userId: string, input: UpdateProfileInput) {
    const user = await server.prisma.user.update({
        where: { id: userId },
        data: {
            ...(input.username && { username: input.username }),
            ...(input.bio !== undefined && { bio: input.bio }),
            ...(input.avatar !== undefined && { avatar: input.avatar }),
        },
    });
    return user;
}

export async function changePassword(server: FastifyInstance, userId: string, input: ChangePasswordInput) {
    const user = await server.prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user || !user.passwordHash) {
        throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isMatch) {
        throw new Error("Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

    await server.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
    });

    return { message: "Password changed successfully" };
}

export async function findOrCreateOAuthUser(
    server: FastifyInstance,
    provider: string,
    providerUserId: string,
    email: string,
    username: string
) {
    // Check if this OAuth account already exists
    const existingAccount = await server.prisma.oAuthAccount.findUnique({
        where: {
            provider_providerUserId: {
                provider,
                providerUserId,
            },
        },
        include: { user: { select: { id: true, email: true, username: true, role: true } } },
    });

    if (existingAccount) {
        return existingAccount.user;
    }

    // Check if a user with this email already exists (link account)
    const existingUser = await server.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, username: true, role: true },
    });

    if (existingUser) {
        await server.prisma.oAuthAccount.create({
            data: {
                provider,
                providerUserId,
                userId: existingUser.id,
            },
        });
        return existingUser;
    }

    // Create new user + OAuth account
    let newUsername = username;
    let retries = 0;

    while (retries < 3) {
        try {
            const user = await server.prisma.user.create({
                data: {
                    username: newUsername,
                    email,
                    accounts: {
                        create: {
                            provider,
                            providerUserId,
                        },
                    },
                },
                select: { id: true, email: true, username: true, role: true },
            });
            return user;
        } catch (error: any) {
            // P2002 is Prisma Unique Constraint Violation
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (Array.isArray(target) && target.includes('username')) {
                    newUsername = `${username}${Math.floor(Math.random() * 10000)}`;
                    retries++;
                    continue;
                }
                if (Array.isArray(target) && target.includes('email')) {
                    throw new Error(`Email ${email} is already in use by another account.`);
                }
            }
            server.log.error(error, "Failed to create OAuth user");
            throw error;
        }
    }
    throw new Error("Failed to generate unique username after multiple retries");
}
