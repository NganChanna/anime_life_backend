
import type { SwaggerOptions } from "@fastify/swagger";
import type { FastifySwaggerUiOptions } from "@fastify/swagger-ui";

export class Swagger {
    public swaggerOptions: SwaggerOptions = {
        openapi: {
            openapi: '3.1.0',
            info: {
                title: "Anime Platform API",
                description: "Backend API for Anime discovery and Social features",
                version: "1.0.0",
            },
            servers: [
                {
                    url: "http://localhost:8080",
                },
            ],
            tags: [{ name: "Default", description: "Default" }],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
    };
    public swaggerUiOptions: FastifySwaggerUiOptions = {
        routePrefix: "/docs",
        // exposeRoute: true,
    };

}

