import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';
import { logger, formatError } from '../utils/logger';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload a file buffer to S3 and return its public URL.
 */
export async function uploadFileToS3(
    file: Express.Multer.File,
    folder: string,
): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const key = `${folder}/${randomUUID()}-${Date.now()}${ext}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        }),
    );

    const url = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    logger.info(`File uploaded to S3: ${url}`);
    return url;
}

/**
 * Delete a file from S3 by its full URL.
 */
export async function deleteFileFromS3(fileUrl: string): Promise<void> {
    try {
        const url = new URL(fileUrl);
        const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

        await s3Client.send(
            new DeleteObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key,
            }),
        );

        logger.info(`File deleted from S3: ${key}`);
    } catch (error) {
        logger.error(`Failed to delete file from S3: ${formatError(error)}`);
        throw error;
    }
}
