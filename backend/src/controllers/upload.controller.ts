import { Request, Response } from 'express';
import { uploadFileToS3 } from '../services/s3.service';
import { logger, formatError } from '../utils/logger';

/**
 * POST /api/uploads
 * Upload a single image to S3 and return its public URL.
 */
export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const url = await uploadFileToS3(req.file, 'order-proofs');

        return res.status(200).json({ url });
    } catch (error) {
        logger.error(`Image upload failed: ${formatError(error)}`);
        return res.status(500).json({ message: 'Failed to upload image' });
    }
};
