import dotenv from "dotenv";
dotenv.config();

export const envConfig = {
    PORT: parseInt(process.env.PORT || "8080", 10),
    HOST: process.env.HOST || '',
    JWT_SECRET: process.env.JWT_SECRET_KEY || 'secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // OAuth
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    OAUTH_CALLBACK_BASE: process.env.OAUTH_CALLBACK_BASE || 'http://localhost:8080',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'anime_live',

    // AWS S3
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    AWS_REGION: process.env.AWS_REGION || '',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
    AWS_S3_FOLDER: process.env.AWS_S3_FOLDER || 'anime_live_videos',

    // AI
    GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY || '',

    // CLERK SECRET
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET || '',
}