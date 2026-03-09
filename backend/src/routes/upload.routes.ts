import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { singleImageUpload } from '../middlewares/upload.middleware';
import { uploadImage } from '../controllers/upload.controller';

const router = Router();

// POST /api/uploads — upload a single image (authenticated, any role)
router.post('/', authenticateJWT, singleImageUpload, uploadImage);

export default router;
