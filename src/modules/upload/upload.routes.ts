import type { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { uploadImageHandler, uploadVideoHandler } from "./upload.controller.js";

const uploadResponseSchema = Type.Object({
    url: Type.String(),
});

export async function uploadRoutes(server: FastifyInstance) {
    // All upload routes require authentication (admin only)
    server.register(async function protectedRoutes(protectedServer) {
        protectedServer.addHook("onRequest", server.authenticate);

        protectedServer.post("/image", {
            schema: {
                consumes: ["multipart/form-data"],
                response: { 200: uploadResponseSchema },
                tags: ["Upload"],
                summary: "Upload an image to Cloudinary",
                description: "Upload a cover image. Returns the Cloudinary URL to store in the database.",
                security: [{ bearerAuth: [] }],
            },
            handler: uploadImageHandler,
        });

        protectedServer.post("/video", {
            schema: {
                consumes: ["multipart/form-data"],
                response: { 200: uploadResponseSchema },
                tags: ["Upload"],
                summary: "Upload a video to AWS S3",
                description: "Upload an episode video. Returns the S3 URL to store in the database.",
                security: [{ bearerAuth: [] }],
            },
            handler: uploadVideoHandler,
        });
    });
}
