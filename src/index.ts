import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { envConfig } from "./config/env-config.js";
import { Swagger } from "./plugins/swagger.js";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import dotenv from "dotenv";
import { authPlugin } from "./plugins/auth.js";
import { oauthPlugin } from "./plugins/oauth.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { userRoutes } from "./modules/user/user.routes.js";
import { animeRoutes } from "./modules/anime/anime.routes.js";
import { uploadRoutes } from "./modules/upload/upload.routes.js";
import { socialRoutes } from "./modules/social/social.routes.js";
import { socialWsRoutes } from "./modules/social/social.ws.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import { notificationRoutes } from "./modules/notification/notification.routes.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
import prisma from "./plugins/prisma.js";
import { handleWebhook } from "./modules/webhook/clerk.js";

dotenv.config();

class Application {
    private app: FastifyInstance;
    private swagger: Swagger;
    constructor() {
        this.app = fastify({
            logger: true,
        });
        this.swagger = new Swagger();
    }

    async registerPlugins() {
        this.app.register(fastifyCors, {
            origin: envConfig.CORS_ORIGIN,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        });
        this.app.register(fastifyCookie);
        this.app.register(fastifyMultipart, { limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max
        this.app.register(prisma);
        this.app.register(fastifySwagger, this.swagger.swaggerOptions);
        this.app.register(fastifySwaggerUi, this.swagger.swaggerUiOptions);
        this.app.register(authPlugin);
        this.app.register(oauthPlugin);
        this.app.register(authRoutes, { prefix: "api/v1/auth" });
        this.app.register(adminRoutes, { prefix: "api/v1/admin" });
        this.app.register(userRoutes, { prefix: "api/v1/users" });
        this.app.register(animeRoutes, { prefix: "api/v1/anime" });
        this.app.register(uploadRoutes, { prefix: "api/v1/upload" });
        this.app.register(socialRoutes, { prefix: "api/v1/social" });
        this.app.register(chatRoutes, { prefix: "api/v1/chat" });
        this.app.register(notificationRoutes, { prefix: "api/v1/notifications" });
        this.app.register(aiRoutes, { prefix: "api/v1/ai" });
        this.app.register(websocket);
        this.app.register(socialWsRoutes, { prefix: "ws" });
        this.app.register(handleWebhook, { prefix: "api/v1/webhook" });
    }
    async startHttpServer() {
        try {
            const address = await this.app.listen({
                port: envConfig.PORT,
                host: envConfig.HOST
            });
            console.log(`Server listening at ${address}`);
        } catch (error) {
            console.error("Failed to start server:", error);
            process.exit(1);
        }
    }

    async start() {
        await this.registerPlugins();
        await this.startHttpServer();
    }
}

/**
 * * Test CI/CD Pipeline
 */
const application = new Application();
application.start();