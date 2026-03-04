import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../../middlewares/auth.middleware';
import { getMetrics, getReviewVelocity, getCampaignProgress } from '../../controllers/dashboard/seller.controller';

const router = Router();

// Dashboard routes for SELLER
router.get('/metrics', authenticateJWT, authorizeRole('SELLER'), getMetrics);
router.get('/velocity', authenticateJWT, authorizeRole('SELLER'), getReviewVelocity);
router.get('/campaign-progress', authenticateJWT, authorizeRole('SELLER'), getCampaignProgress);

export default router;
