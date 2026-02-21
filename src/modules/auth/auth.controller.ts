import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateUserInput, LoginUserInput, UpdateProfileInput, ChangePasswordInput } from "./auth.schema.js";
import { createUser, loginUser, updateProfile, changePassword, findOrCreateOAuthUser, generateToken } from "./auth.service.js";
import { envConfig } from "../../config/env-config.js";

export async function registerHandler(
    request: FastifyRequest<{ Body: CreateUserInput }>,
    reply: FastifyReply
) {
    try {
        const user = await createUser(request.server, request.body);
        return reply.code(201).send({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        });
    } catch (error: any) {
        request.log.error(error);
        if (error.message.includes("already exists")) {
            return reply.code(409).send({
                statusCode: 409,
                error: "Conflict",
                message: error.message,
            });
        }
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Something went wrong",
        });
    }
}

export async function loginHandler(
    request: FastifyRequest<{ Body: LoginUserInput }>,
    reply: FastifyReply
) {
    try {
        const { accessToken } = await loginUser(request.server, request.body);

        return reply.code(200).send({
            accessToken,
        });
    } catch (error: any) {
        request.log.error(error);
        return reply.code(401).send({
            statusCode: 401,
            error: "Unauthorized",
            message: "Invalid email or password",
        });
    }
}

export async function getMeHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = request.user as { id: string };
    const user = await request.server.prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, email: true, avatar: true, bio: true, role: true, createdAt: true },
    });
    if (!user) {
        request.log.warn({ userId: id }, "getMeHandler: User not found");
        return reply.code(404).send({ statusCode: 404, error: "Not Found", message: "User not found" });
    }
    request.log.info({ user }, "getMeHandler: Returning user");
    return reply.code(200).send(user);
}

export async function updateProfileHandler(
    request: FastifyRequest<{ Body: UpdateProfileInput }>,
    reply: FastifyReply
) {
    try {
        const { id } = request.user as { id: string };
        const user = await updateProfile(request.server, id, request.body);
        return reply.code(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
        });
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Something went wrong",
        });
    }
}

export async function changePasswordHandler(
    request: FastifyRequest<{ Body: ChangePasswordInput }>,
    reply: FastifyReply
) {
    try {
        const { id } = request.user as { id: string };
        const result = await changePassword(request.server, id, request.body);
        return reply.code(200).send(result);
    } catch (error: any) {
        request.log.error(error);
        if (error.message.includes("incorrect")) {
            return reply.code(400).send({
                statusCode: 400,
                error: "Bad Request",
                message: error.message,
            });
        }
        return reply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: "Something went wrong",
        });
    }
}

export async function logoutHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    return reply
        .clearCookie("token")
        .code(200)
        .send({ message: "Logged out successfully" });
}

export async function githubCallbackHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        console.log("👉 GitHub Callback HIT");
        const { token } = await (request.server as any).githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        console.log("👉 GitHub Token:", !!token);

        // Fetch GitHub user profile
        const userResponse = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        const githubUser = await userResponse.json() as { id: number; login: string; email: string | null };
        console.log("👉 GitHub User:", githubUser.login);

        // Fetch primary email if not public
        let email = githubUser.email;
        if (!email) {
            console.log("👉 Fetching GitHub Emails...");
            const emailsResponse = await fetch("https://api.github.com/user/emails", {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });
            const emails = await emailsResponse.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
            const primary = emails.find((e) => e.primary && e.verified);
            email = primary?.email || emails[0]?.email || "";
            console.log("👉 GitHub Email resolved:", email);
        }

        const user = await findOrCreateOAuthUser(
            request.server,
            "github",
            String(githubUser.id),
            email!,
            githubUser.login
        );
        console.log("👉 User Found/Created ID:", user.id);

        const accessToken = generateToken(request.server, user);
        return reply.redirect(`${envConfig.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error: any) {
        console.error("❌ GitHub Auth Error:", error);
        return reply.redirect(`${envConfig.FRONTEND_URL}/auth/callback?error=oauth_failed&details=${encodeURIComponent(error.message)}`);
    }
}

export async function googleCallbackHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        console.log("👉 Google Callback HIT");
        const { token } = await (request.server as any).googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        console.log("👉 Google Token:", !!token);

        // Fetch Google user profile
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        const googleUser = await userResponse.json() as { id: string; email: string; name: string };
        console.log("👉 Google User:", googleUser.email);

        const user = await findOrCreateOAuthUser(
            request.server,
            "google",
            googleUser.id,
            googleUser.email,
            googleUser.name
        );
        console.log("👉 User Found/Created ID:", user.id);

        const accessToken = generateToken(request.server, user);
        return reply.redirect(`${envConfig.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error: any) {
        console.error("❌ Google Auth Error:", error);
        return reply.redirect(`${envConfig.FRONTEND_URL}/auth/callback?error=oauth_failed&details=${encodeURIComponent(error.message)}`);
    }
}
