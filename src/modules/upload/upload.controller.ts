import type { FastifyReply, FastifyRequest } from "fastify";
import { uploadImageToCloudinary } from "../../plugins/cloudinary.js";
import { uploadVideoToS3 } from "../../plugins/s3.js";

// ── POST /upload/image ──

export async function uploadImageHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const file = await request.file();

        if (!file) {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "No file uploaded" });
        }

        if (!file.mimetype.startsWith("image/")) {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "File must be an image" });
        }

        const buffer = await file.toBuffer();
        const url = await uploadImageToCloudinary(buffer);

        return reply.code(200).send({ url });
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Image upload failed" });
    }
}

// ── POST /upload/video ──

export async function uploadVideoHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const file = await request.file();

        if (!file) {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "No file uploaded" });
        }

        if (!file.mimetype.startsWith("video/")) {
            return reply.code(400).send({ statusCode: 400, error: "Bad Request", message: "File must be a video" });
        }

        const buffer = await file.toBuffer();
        const url = await uploadVideoToS3(buffer, file.filename, file.mimetype);

        return reply.code(200).send({ url });
    } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ statusCode: 500, error: "Internal Server Error", message: "Video upload failed" });
    }
}
