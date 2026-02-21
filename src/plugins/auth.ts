import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { envConfig } from "../config/env-config.js";
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

// Extend FastifyInstance to include the 'authenticate' and 'authorizeAdmin' decorators
declare module "fastify" {
    interface FastifyInstance {
        authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
        authorizeAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}

const authPluginCallback: FastifyPluginAsync = async (server) => {
    server.register(fastifyJwt, {
        secret: envConfig.JWT_SECRET,
        cookie: {
            cookieName: "token",
            signed: false, // Set to true if you want to sign the cookie with fastify-cookie's secret
        },
    });

    server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    server.decorate("authorizeAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            const user = request.user as { id: string; role: string };
            if (user.role !== "ADMIN") {
                return reply.code(403).send({
                    statusCode: 403,
                    error: "Forbidden",
                    message: "Admin access required",
                });
            }
        } catch (err) {
            reply.send(err);
        }
    });
};

export const authPlugin = fp(authPluginCallback);