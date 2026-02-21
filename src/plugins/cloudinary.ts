import { v2 as cloudinary } from "cloudinary";
import { envConfig } from "../config/env-config.js";

// Configure Cloudinary SDK
cloudinary.config({
    cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
    api_key: envConfig.CLOUDINARY_API_KEY,
    api_secret: envConfig.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImageToCloudinary(
    fileBuffer: Buffer,
    folder: string = envConfig.CLOUDINARY_FOLDER
): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error("Cloudinary returned no result"));
                resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
}

export { cloudinary };
