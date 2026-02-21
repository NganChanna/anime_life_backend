import fp from "fastify-plugin";
import fastifyOAuth2 from "@fastify/oauth2";
import { envConfig } from "../config/env-config.js";
import type { FastifyPluginAsync } from "fastify";

const oauthSetup: FastifyPluginAsync = async (server) => {
    // ── GitHub OAuth2 ──
    await server.register(fastifyOAuth2, {
        name: "githubOAuth2",
        credentials: {
            client: {
                id: envConfig.GITHUB_CLIENT_ID,
                secret: envConfig.GITHUB_CLIENT_SECRET,
            },
            auth: {
                authorizeHost: "https://github.com",
                authorizePath: "/login/oauth/authorize",
                tokenHost: "https://github.com",
                tokenPath: "/login/oauth/access_token",
            },
        },
        startRedirectPath: "/api/v1/auth/login/github",
        callbackUri: `${envConfig.OAUTH_CALLBACK_BASE}/api/v1/auth/github/callback`,
        scope: ["user:email"],
        cookie: {
            path: "/",
            secure: false, // IMPORTANT for localhost
            sameSite: "lax",
            httpOnly: true,
            maxAge: 60 * 10, // 10 minutes
        },
    });

    // ── Google OAuth2 ──
    await server.register(fastifyOAuth2, {
        name: "googleOAuth2",
        credentials: {
            client: {
                id: envConfig.GOOGLE_CLIENT_ID,
                secret: envConfig.GOOGLE_CLIENT_SECRET,
            },
            auth: {
                authorizeHost: "https://accounts.google.com",
                authorizePath: "/o/oauth2/v2/auth",
                tokenHost: "https://oauth2.googleapis.com",
                tokenPath: "/token",
            },
        },
        startRedirectPath: "/api/v1/auth/login/google",
        callbackUri: `${envConfig.OAUTH_CALLBACK_BASE}/api/v1/auth/google/callback`,
        scope: ["profile", "email"],
        pkce: "S256",
        cookie: {
            path: "/",
            secure: false, // IMPORTANT for localhost
            sameSite: "lax",
            httpOnly: true,
            maxAge: 60 * 10, // 10 minutes
        },
    });
};

export const oauthPlugin = fp(oauthSetup);
