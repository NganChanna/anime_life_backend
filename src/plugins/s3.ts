import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { envConfig } from "../config/env-config.js";

// Configure S3 Client
const s3Client = new S3Client({
    region: envConfig.AWS_REGION,
    credentials: {
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload a video buffer to AWS S3.
 * Returns the public URL of the uploaded video.
 */
export async function uploadVideoToS3(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<string> {
    const key = `${envConfig.AWS_S3_FOLDER}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: envConfig.AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    try {
        await s3Client.send(command);
        // Construct the public URL
        return `https://${envConfig.AWS_S3_BUCKET}.s3.${envConfig.AWS_REGION}.amazonaws.com/${envConfig.AWS_S3_FOLDER}/${fileName}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("Failed to upload to cloud storage");
    }
}

export { s3Client };
